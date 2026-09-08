"""
Database and CSV Telemetry Ingestion Layer for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises

Provides SQLite storage and querying backed by synthetic CSV telemetry.
"""

import sqlite3
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
import pandas as pd

from backend.models import (
    Build, TaskTiming, CacheEvent, AgentUtilisation, GroundTruth,
    BuildDetail, OrganisationSummary
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "ci_insight.db"


def get_connection() -> sqlite3.Connection:
    """Get SQLite database connection with row factory"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(force_reload: bool = False):
    """
    Initialize SQLite tables and ingest CSV datasets if not already populated.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()

    # Create tables
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS builds (
        build_id TEXT PRIMARY KEY,
        organisation_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        build_status TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        total_duration_seconds REAL NOT NULL,
        queue_time_seconds REAL NOT NULL,
        agent_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_timings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        build_id TEXT NOT NULL,
        task_name TEXT NOT NULL,
        duration_seconds REAL NOT NULL,
        dependency_group TEXT NOT NULL,
        parallelisable INTEGER NOT NULL,
        FOREIGN KEY(build_id) REFERENCES builds(build_id)
    );

    CREATE TABLE IF NOT EXISTS cache_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        build_id TEXT NOT NULL,
        task_name TEXT NOT NULL,
        cache_status TEXT NOT NULL,
        cache_key TEXT NOT NULL,
        FOREIGN KEY(build_id) REFERENCES builds(build_id)
    );

    CREATE TABLE IF NOT EXISTS agent_utilisation (
        build_id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        cpu_utilisation REAL NOT NULL,
        memory_utilisation REAL NOT NULL,
        busy_percentage REAL NOT NULL,
        available_agents INTEGER NOT NULL,
        FOREIGN KEY(build_id) REFERENCES builds(build_id)
    );

    CREATE TABLE IF NOT EXISTS ground_truth (
        build_id TEXT PRIMARY KEY,
        actual_bottleneck TEXT NOT NULL,
        severity TEXT NOT NULL,
        FOREIGN KEY(build_id) REFERENCES builds(build_id)
    );

    CREATE INDEX IF NOT EXISTS idx_builds_org ON builds(organisation_id);
    CREATE INDEX IF NOT EXISTS idx_builds_proj ON builds(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_build ON task_timings(build_id);
    CREATE INDEX IF NOT EXISTS idx_cache_build ON cache_events(build_id);
    """)
    conn.commit()

    # Check if builds already exist
    cursor.execute("SELECT COUNT(*) FROM builds")
    build_count = cursor.fetchone()[0]

    if build_count == 0 or force_reload:
        builds_csv = DATA_DIR / "builds.csv"
        tasks_csv = DATA_DIR / "task_timings.csv"
        cache_csv = DATA_DIR / "cache_events.csv"
        agent_csv = DATA_DIR / "agent_utilisation.csv"
        truth_csv = DATA_DIR / "ground_truth.csv"

        if builds_csv.exists() and tasks_csv.exists():
            if force_reload:
                cursor.executescript("""
                    DELETE FROM builds;
                    DELETE FROM task_timings;
                    DELETE FROM cache_events;
                    DELETE FROM agent_utilisation;
                    DELETE FROM ground_truth;
                """)
                conn.commit()

            # Ingest CSVs via Pandas
            df_builds = pd.read_csv(builds_csv)
            df_builds.to_sql("builds", conn, if_exists="append", index=False)

            df_tasks = pd.read_csv(tasks_csv)
            df_tasks["parallelisable"] = df_tasks["parallelisable"].astype(int)
            df_tasks.to_sql("task_timings", conn, if_exists="append", index=False)

            if cache_csv.exists():
                df_cache = pd.read_csv(cache_csv)
                df_cache.to_sql("cache_events", conn, if_exists="append", index=False)

            if agent_csv.exists():
                df_agent = pd.read_csv(agent_csv)
                df_agent.to_sql("agent_utilisation", conn, if_exists="append", index=False)

            if truth_csv.exists():
                df_truth = pd.read_csv(truth_csv)
                df_truth.to_sql("ground_truth", conn, if_exists="append", index=False)

            conn.commit()

    conn.close()


def get_organisations() -> List[OrganisationSummary]:
    """Retrieve summary telemetry for each organisation"""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT organisation_id FROM builds ORDER BY organisation_id
    """)
    org_rows = cursor.fetchall()
    summaries = []

    for row in org_rows:
        org_id = row["organisation_id"]

        # Projects list
        cursor.execute("SELECT DISTINCT project_id FROM builds WHERE organisation_id = ?", (org_id,))
        projects = [p["project_id"] for p in cursor.fetchall()]

        # Aggregate stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_builds,
                AVG(total_duration_seconds) as avg_duration,
                AVG(queue_time_seconds) as avg_queue,
                SUM(CASE WHEN build_status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count
            FROM builds 
            WHERE organisation_id = ?
        """, (org_id,))
        stats = cursor.fetchone()

        total = stats["total_builds"] or 0
        avg_dur = round(stats["avg_duration"] or 0.0, 2)
        avg_q = round(stats["avg_queue"] or 0.0, 2)
        success_pct = round((stats["success_count"] / total * 100) if total > 0 else 0.0, 2)

        # Bottleneck distribution
        cursor.execute("""
            SELECT g.actual_bottleneck, COUNT(*) as cnt
            FROM builds b
            JOIN ground_truth g ON b.build_id = g.build_id
            WHERE b.organisation_id = ?
            GROUP BY g.actual_bottleneck
        """, (org_id,))
        dist = {r["actual_bottleneck"]: r["cnt"] for r in cursor.fetchall()}

        summaries.append(OrganisationSummary(
            organisation_id=org_id,
            total_builds=total,
            projects=projects,
            avg_duration_seconds=avg_dur,
            avg_queue_time_seconds=avg_q,
            success_rate_percent=success_pct,
            bottleneck_distribution=dist
        ))

    conn.close()
    return summaries


def get_builds(
    organisation_id: Optional[str] = None,
    project_id: Optional[str] = None,
    build_status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[int, List[Build]]:
    """Retrieve filtered and paginated build records"""
    conn = get_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    if organisation_id:
        conditions.append("organisation_id = ?")
        params.append(organisation_id)
    if project_id:
        conditions.append("project_id = ?")
        params.append(project_id)
    if build_status:
        conditions.append("build_status = ?")
        params.append(build_status)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Count total matching
    count_query = f"SELECT COUNT(*) FROM builds {where_clause}"
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]

    # Query page
    query = f"""
        SELECT build_id, organisation_id, project_id, build_status,
               start_time, end_time, total_duration_seconds, queue_time_seconds, agent_id
        FROM builds
        {where_clause}
        ORDER BY start_time DESC
        LIMIT ? OFFSET ?
    """
    cursor.execute(query, params + [limit, offset])
    rows = cursor.fetchall()

    builds = [
        Build(
            build_id=r["build_id"],
            organisation_id=r["organisation_id"],
            project_id=r["project_id"],
            build_status=r["build_status"],
            start_time=r["start_time"],
            end_time=r["end_time"],
            total_duration_seconds=r["total_duration_seconds"],
            queue_time_seconds=r["queue_time_seconds"],
            agent_id=r["agent_id"]
        )
        for r in rows
    ]

    conn.close()
    return total_count, builds


def get_build_by_id(build_id: str) -> Optional[BuildDetail]:
    """Retrieve full details for a single build, including tasks and ground truth"""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Base build
    cursor.execute("SELECT * FROM builds WHERE build_id = ?", (build_id,))
    b_row = cursor.fetchone()
    if not b_row:
        conn.close()
        return None

    build_obj = Build(
        build_id=b_row["build_id"],
        organisation_id=b_row["organisation_id"],
        project_id=b_row["project_id"],
        build_status=b_row["build_status"],
        start_time=b_row["start_time"],
        end_time=b_row["end_time"],
        total_duration_seconds=b_row["total_duration_seconds"],
        queue_time_seconds=b_row["queue_time_seconds"],
        agent_id=b_row["agent_id"]
    )

    # 2. Tasks
    cursor.execute("""
        SELECT task_name, duration_seconds, dependency_group, parallelisable
        FROM task_timings WHERE build_id = ? ORDER BY id
    """, (build_id,))
    tasks = [
        TaskTiming(
            build_id=build_id,
            task_name=t["task_name"],
            duration_seconds=t["duration_seconds"],
            dependency_group=t["dependency_group"],
            parallelisable=bool(t["parallelisable"])
        )
        for t in cursor.fetchall()
    ]

    # 3. Cache events
    cursor.execute("""
        SELECT task_name, cache_status, cache_key
        FROM cache_events WHERE build_id = ? ORDER BY id
    """, (build_id,))
    cache_events = [
        CacheEvent(
            build_id=build_id,
            task_name=c["task_name"],
            cache_status=c["cache_status"],
            cache_key=c["cache_key"]
        )
        for c in cursor.fetchall()
    ]

    # 4. Agent utilisation
    cursor.execute("SELECT * FROM agent_utilisation WHERE build_id = ?", (build_id,))
    a_row = cursor.fetchone()
    agent_util = None
    if a_row:
        agent_util = AgentUtilisation(
            build_id=build_id,
            agent_id=a_row["agent_id"],
            cpu_utilisation=a_row["cpu_utilisation"],
            memory_utilisation=a_row["memory_utilisation"],
            busy_percentage=a_row["busy_percentage"],
            available_agents=a_row["available_agents"]
        )

    # 5. Ground truth
    cursor.execute("SELECT * FROM ground_truth WHERE build_id = ?", (build_id,))
    g_row = cursor.fetchone()
    ground_truth = None
    if g_row:
        ground_truth = GroundTruth(
            build_id=build_id,
            actual_bottleneck=g_row["actual_bottleneck"],
            severity=g_row["severity"]
        )

    conn.close()
    return BuildDetail(
        build=build_obj,
        tasks=tasks,
        cache_events=cache_events,
        agent_utilisation=agent_util,
        ground_truth=ground_truth
    )
