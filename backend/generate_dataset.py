"""
Synthetic CI/CD Telemetry Dataset Generator for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises

This script generates a realistic synthetic dataset of 1,200+ CI builds
distributed across 3 enterprise organisations (Org_A, Org_B, Org_C)
spanning multiple projects and teams.

Simulated Bottleneck Archetypes:
--------------------------------
1. CACHE_PROBLEM:
   - Simulated by introducing cache misses on repetitive tasks (e.g. dependency_install, compile).
   - Occurs when cache keys churn rapidly or cache eviction thresholds are too aggressive.
   - Result: Tasks that could finish in seconds take several minutes re-downloading or recompiling.

2. PARALLELISATION_PROBLEM:
   - Independent tasks (e.g., unit_tests, lint/security_scan, frontend_build) belonging to distinct
     dependency groups are scheduled sequentially instead of concurrently.
   - Result: Total duration is the direct sum of all task times rather than max(task_durations).

3. QUEUE_CONGESTION:
   - High build queue wait times (>300 seconds) caused by fleet-wide agent shortages or spike periods.
   - Telemetry shows high queue_time_seconds even when task execution duration is normal.

4. SLOW_TASK:
   - A single monolithic task (e.g., unparallelised end-to-end integration_tests or large compilation)
     exceeds the 90th percentile (P90) duration threshold, dominating the overall pipeline runtime.

5. RESOURCE_BOTTLENECK:
   - Agent host saturation where CPU utilisation > 85% or Memory utilisation > 85%.
   - Causes CPU throttling, disk I/O thrashing, and prolonged execution of all concurrent steps.

6. NORMAL:
   - Baseline, well-tuned pipelines with high cache hit rates (>85%), low queue delays (<60s),
     parallelised independent tasks, and balanced agent resource utilisation (40-70%).

Realistic Noise & Ambiguity:
----------------------------
- Contains borderline cases (e.g. moderate queue time of 250s, 50% cache hit rate) to allow
  rigorous false positive and false negative analysis in downstream evaluation.
"""

import os
import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import numpy as np

# Set fixed random seed for 100% reproducible dataset generation
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

NUM_BUILDS = 1200

ORGANISATIONS = {
    "Org_A": {
        "name": "Global Retail Banking",
        "projects": ["mobile-banking-api", "payment-clearing-engine", "fraud-detection-service", "customer-portal"],
        "agents": ["agent-east-01", "agent-east-02", "agent-east-03", "agent-east-04"],
        "primary_bottleneck_bias": "QUEUE_CONGESTION"  # High traffic, agent pool congestion
    },
    "Org_B": {
        "name": "Healthcare Claims Network",
        "projects": ["claims-ingestion-pipeline", "hipaa-compliance-scan", "provider-directory", "ehr-bridge"],
        "agents": ["agent-central-01", "agent-central-02", "agent-central-03"],
        "primary_bottleneck_bias": "CACHE_PROBLEM"  # Heavy dependency trees, cache invalidation
    },
    "Org_C": {
        "name": "Aviation Logistics Platform",
        "projects": ["flight-telemetry-ingest", "cargo-manifest-service", "safety-audit-service"],
        "agents": ["agent-west-01", "agent-west-02", "agent-west-03", "agent-west-04", "agent-west-05"],
        "primary_bottleneck_bias": "PARALLELISATION_PROBLEM"  # Monolithic legacy task configurations
    }
}

TASK_CATALOG = [
    {"name": "dependency_install", "base_duration": 45.0, "dependency_group": "setup", "can_parallel": False, "cachable": True},
    {"name": "compile", "base_duration": 80.0, "dependency_group": "build", "can_parallel": False, "cachable": True},
    {"name": "unit_tests", "base_duration": 95.0, "dependency_group": "test", "can_parallel": True, "cachable": False},
    {"name": "integration_tests", "base_duration": 180.0, "dependency_group": "test", "can_parallel": True, "cachable": False},
    {"name": "security_scan", "base_duration": 70.0, "dependency_group": "verification", "can_parallel": True, "cachable": True},
    {"name": "package_build", "base_duration": 50.0, "dependency_group": "package", "can_parallel": False, "cachable": True},
    {"name": "deployment_validation", "base_duration": 40.0, "dependency_group": "validate", "can_parallel": False, "cachable": False}
]

BOTTLENECK_TYPES = [
    "NORMAL",
    "CACHE_PROBLEM",
    "PARALLELISATION_PROBLEM",
    "QUEUE_CONGESTION",
    "SLOW_TASK",
    "RESOURCE_BOTTLENECK"
]

def generate_telemetry():
    builds_records = []
    task_timings_records = []
    cache_events_records = []
    agent_utilisation_records = []
    ground_truth_records = []

    start_reference_date = datetime(2026, 8, 1, 8, 0, 0)

    for i in range(1, NUM_BUILDS + 1):
        build_id = f"BUILD-{i:04d}"
        
        # Distribute builds across organisations
        org_id = random.choices(["Org_A", "Org_B", "Org_C"], weights=[0.40, 0.35, 0.25])[0]
        org_info = ORGANISATIONS[org_id]
        project_id = random.choice(org_info["projects"])
        agent_id = random.choice(org_info["agents"])

        # Determine build bottleneck archetype with realistic distribution & org bias
        bias = org_info["primary_bottleneck_bias"]
        weights = [0.42, 0.12, 0.12, 0.12, 0.11, 0.11]  # ~42% Normal, ~58% Bottlenecks
        if bias == "QUEUE_CONGESTION":
            weights = [0.30, 0.10, 0.10, 0.30, 0.10, 0.10]
        elif bias == "CACHE_PROBLEM":
            weights = [0.30, 0.30, 0.10, 0.10, 0.10, 0.10]
        elif bias == "PARALLELISATION_PROBLEM":
            weights = [0.30, 0.10, 0.30, 0.10, 0.10, 0.10]
            
        bottleneck_type = random.choices(BOTTLENECK_TYPES, weights=weights)[0]

        # Determine Severity based on bottleneck type
        if bottleneck_type == "NORMAL":
            severity = "LOW"
            build_status = random.choices(["SUCCESS", "FAILED"], weights=[0.96, 0.04])[0]
        elif bottleneck_type in ["QUEUE_CONGESTION", "RESOURCE_BOTTLENECK"]:
            severity = random.choices(["MEDIUM", "HIGH", "CRITICAL"], weights=[0.25, 0.50, 0.25])[0]
            build_status = random.choices(["SUCCESS", "FAILED", "CANCELLED"], weights=[0.85, 0.10, 0.05])[0]
        elif bottleneck_type == "SLOW_TASK":
            severity = random.choices(["MEDIUM", "HIGH", "CRITICAL"], weights=[0.20, 0.55, 0.25])[0]
            build_status = random.choices(["SUCCESS", "FAILED"], weights=[0.88, 0.12])[0]
        else: # CACHE_PROBLEM or PARALLELISATION_PROBLEM
            severity = random.choices(["MEDIUM", "HIGH"], weights=[0.45, 0.55])[0]
            build_status = random.choices(["SUCCESS", "FAILED"], weights=[0.92, 0.08])[0]

        # 1. Queue Time Generation
        if bottleneck_type == "QUEUE_CONGESTION":
            # Severe queue time: 300s to 750s
            queue_time = round(np.random.normal(loc=460.0, scale=80.0), 2)
            queue_time = max(305.0, queue_time)
        elif bottleneck_type == "NORMAL":
            # Normal queue time: 5s to 60s
            queue_time = round(np.random.exponential(scale=20.0) + 5.0, 2)
            queue_time = min(120.0, queue_time)
        else:
            # Baseline queue time: 20s to 180s with occasional mild spikes
            queue_time = round(np.random.normal(loc=55.0, scale=35.0), 2)
            queue_time = max(8.0, queue_time)

        # 2. Tasks & Execution Generation
        num_tasks = random.randint(5, 7)
        selected_tasks = random.sample(TASK_CATALOG, num_tasks)
        
        total_task_duration = 0.0
        build_task_records = []
        build_cache_records = []

        for task_def in selected_tasks:
            t_name = task_def["name"]
            t_group = task_def["dependency_group"]
            t_parallel = task_def["can_parallel"]
            t_cachable = task_def["cachable"]
            
            # Duration simulation
            dur = max(5.0, np.random.normal(loc=task_def["base_duration"], scale=task_def["base_duration"] * 0.15))

            # Apply Archetype Distortions
            if bottleneck_type == "SLOW_TASK" and t_name in ["integration_tests", "compile"]:
                # Massive single task duration spike (> P90)
                dur *= random.uniform(2.8, 4.5)
            elif bottleneck_type == "RESOURCE_BOTTLENECK":
                # CPU/Memory contention slows down all compute steps by 30-70%
                dur *= random.uniform(1.3, 1.7)
            
            # Cache event simulation for cachable tasks
            if t_cachable:
                if bottleneck_type == "CACHE_PROBLEM":
                    # High cache miss scenario: 75% MISS
                    cache_status = random.choices(["HIT", "MISS"], weights=[0.20, 0.80])[0]
                    if cache_status == "MISS":
                        dur *= random.uniform(1.8, 2.6)  # Penalty of re-downloading or full recompilation
                elif bottleneck_type == "NORMAL":
                    # Normal high cache efficiency: 90% HIT
                    cache_status = random.choices(["HIT", "MISS"], weights=[0.90, 0.10])[0]
                    if cache_status == "HIT":
                        dur *= 0.35  # Instant cache restoration
                else:
                    cache_status = random.choices(["HIT", "MISS"], weights=[0.65, 0.35])[0]
                    if cache_status == "HIT":
                        dur *= 0.45

                cache_key = f"{project_id}-{t_name}-sha-{hash(f'{build_id}-{t_name}') % 100000:05d}"
                build_cache_records.append({
                    "build_id": build_id,
                    "task_name": t_name,
                    "cache_status": cache_status,
                    "cache_key": cache_key
                })

            # Parallelisation problem simulation:
            # If bottleneck is PARALLELISATION_PROBLEM, independent tasks are marked sequential
            actual_parallel = t_parallel
            if bottleneck_type == "PARALLELISATION_PROBLEM" and t_parallel:
                # Force sequential flag to highlight missed parallelisation opportunity
                actual_parallel = False
            
            dur = round(dur, 2)
            total_task_duration += dur
            
            build_task_records.append({
                "build_id": build_id,
                "task_name": t_name,
                "duration_seconds": dur,
                "dependency_group": t_group,
                "parallelisable": actual_parallel
            })

        # Calculate realistic total build duration:
        # If parallelisable tasks run concurrently, total time is reduced; if sequential, it's cumulative.
        if bottleneck_type == "PARALLELISATION_PROBLEM":
            total_build_duration = round(total_task_duration + np.random.uniform(10.0, 30.0), 2)
        else:
            # Real CI pipelines with concurrent stages shave off 25-45% of total sequential task time
            concurrency_savings = total_task_duration * random.uniform(0.20, 0.40)
            total_build_duration = round(max(30.0, total_task_duration - concurrency_savings + 15.0), 2)

        # 3. Agent Resource Utilisation
        if bottleneck_type == "RESOURCE_BOTTLENECK":
            cpu_util = round(random.uniform(86.0, 98.5), 1)
            mem_util = round(random.uniform(85.0, 96.0), 1)
            busy_pct = round(random.uniform(88.0, 99.0), 1)
            avail_agents = random.randint(0, 1)
        elif bottleneck_type == "QUEUE_CONGESTION":
            cpu_util = round(random.uniform(70.0, 85.0), 1)
            mem_util = round(random.uniform(65.0, 80.0), 1)
            busy_pct = round(random.uniform(90.0, 100.0), 1)  # Fleet fully busy
            avail_agents = 0
        elif bottleneck_type == "NORMAL":
            cpu_util = round(random.uniform(35.0, 68.0), 1)
            mem_util = round(random.uniform(40.0, 65.0), 1)
            busy_pct = round(random.uniform(45.0, 72.0), 1)
            avail_agents = random.randint(2, 6)
        else:
            cpu_util = round(random.uniform(45.0, 78.0), 1)
            mem_util = round(random.uniform(48.0, 76.0), 1)
            busy_pct = round(random.uniform(55.0, 82.0), 1)
            avail_agents = random.randint(1, 4)

        agent_record = {
            "build_id": build_id,
            "agent_id": agent_id,
            "cpu_utilisation": cpu_util,
            "memory_utilisation": mem_util,
            "busy_percentage": busy_pct,
            "available_agents": avail_agents
        }

        # 4. Timestamp Generation
        build_start = start_reference_date + timedelta(minutes=i * 22 + random.randint(-5, 5))
        build_end = build_start + timedelta(seconds=int(total_build_duration + queue_time))

        build_record = {
            "build_id": build_id,
            "organisation_id": org_id,
            "project_id": project_id,
            "build_status": build_status,
            "start_time": build_start.isoformat(),
            "end_time": build_end.isoformat(),
            "total_duration_seconds": total_build_duration,
            "queue_time_seconds": queue_time,
            "agent_id": agent_id
        }

        ground_truth_record = {
            "build_id": build_id,
            "actual_bottleneck": bottleneck_type,
            "severity": severity
        }

        # Accumulate records
        builds_records.append(build_record)
        task_timings_records.extend(build_task_records)
        cache_events_records.extend(build_cache_records)
        agent_utilisation_records.append(agent_record)
        ground_truth_records.append(ground_truth_record)

    # Convert to DataFrames and save to CSV
    df_builds = pd.DataFrame(builds_records)
    df_tasks = pd.DataFrame(task_timings_records)
    df_cache = pd.DataFrame(cache_events_records)
    df_agent = pd.DataFrame(agent_utilisation_records)
    df_truth = pd.DataFrame(ground_truth_records)

    builds_path = DATA_DIR / "builds.csv"
    tasks_path = DATA_DIR / "task_timings.csv"
    cache_path = DATA_DIR / "cache_events.csv"
    agent_path = DATA_DIR / "agent_utilisation.csv"
    truth_path = DATA_DIR / "ground_truth.csv"

    df_builds.to_csv(builds_path, index=False)
    df_tasks.to_csv(tasks_path, index=False)
    df_cache.to_csv(cache_path, index=False)
    df_agent.to_csv(agent_path, index=False)
    df_truth.to_csv(truth_path, index=False)

    print(f"[OK] Generated {len(df_builds)} builds in {builds_path}")
    print(f"[OK] Generated {len(df_tasks)} task timings in {tasks_path}")
    print(f"[OK] Generated {len(df_cache)} cache events in {cache_path}")
    print(f"[OK] Generated {len(df_agent)} agent records in {agent_path}")
    print(f"[OK] Generated {len(df_truth)} ground truth records in {truth_path}")
    print("\nBottleneck Distribution:")
    print(df_truth["actual_bottleneck"].value_counts())
    print("\nOrganisation Distribution:")
    print(df_builds["organisation_id"].value_counts())

if __name__ == "__main__":
    generate_telemetry()
