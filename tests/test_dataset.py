"""
Dataset Validation Test Suite for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises
"""

from pathlib import Path
import pandas as pd
import pytest

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def test_dataset_files_exist():
    """Verify all 5 required CSV files exist in data/ directory"""
    required_files = [
        "builds.csv",
        "task_timings.csv",
        "cache_events.csv",
        "agent_utilisation.csv",
        "ground_truth.csv"
    ]
    for filename in required_files:
        file_path = DATA_DIR / filename
        assert file_path.exists(), f"Missing required file: {filename}"
        assert file_path.stat().st_size > 0, f"File is empty: {filename}"


def test_builds_csv_schema_and_volume():
    """Verify builds.csv has at least 1,000 records and all required columns"""
    df = pd.read_csv(DATA_DIR / "builds.csv")
    assert len(df) >= 1000, f"Expected >= 1000 builds, found {len(df)}"
    
    required_columns = [
        "build_id", "organisation_id", "project_id", "build_status",
        "start_time", "end_time", "total_duration_seconds", "queue_time_seconds", "agent_id"
    ]
    for col in required_columns:
        assert col in df.columns, f"Missing column in builds.csv: {col}"
        
    assert df["build_id"].is_unique, "build_id must be unique in builds.csv"
    assert df["total_duration_seconds"].min() > 0, "Duration must be positive"
    assert df["queue_time_seconds"].min() >= 0, "Queue time cannot be negative"


def test_organisations_distribution():
    """Verify at least 3 organisations exist in builds dataset"""
    df = pd.read_csv(DATA_DIR / "builds.csv")
    orgs = set(df["organisation_id"].unique())
    assert {"Org_A", "Org_B", "Org_C"}.issubset(orgs)


def test_task_timings_schema():
    """Verify task_timings.csv schema and valid task names"""
    df = pd.read_csv(DATA_DIR / "task_timings.csv")
    required_cols = ["build_id", "task_name", "duration_seconds", "dependency_group", "parallelisable"]
    for col in required_cols:
        assert col in df.columns

    valid_tasks = {
        "dependency_install", "compile", "unit_tests",
        "integration_tests", "security_scan", "package_build", "deployment_validation"
    }
    present_tasks = set(df["task_name"].unique())
    assert present_tasks.issubset(valid_tasks)


def test_cache_events_schema():
    """Verify cache_events.csv statuses are HIT or MISS"""
    df = pd.read_csv(DATA_DIR / "cache_events.csv")
    required_cols = ["build_id", "task_name", "cache_status", "cache_key"]
    for col in required_cols:
        assert col in df.columns
        
    statuses = set(df["cache_status"].unique())
    assert statuses.issubset({"HIT", "MISS"})


def test_agent_utilisation_schema():
    """Verify agent_utilisation.csv bounds and columns"""
    df = pd.read_csv(DATA_DIR / "agent_utilisation.csv")
    required_cols = ["build_id", "agent_id", "cpu_utilisation", "memory_utilisation", "busy_percentage", "available_agents"]
    for col in required_cols:
        assert col in df.columns

    assert (df["cpu_utilisation"] >= 0).all() and (df["cpu_utilisation"] <= 100).all()
    assert (df["memory_utilisation"] >= 0).all() and (df["memory_utilisation"] <= 100).all()


def test_ground_truth_labels():
    """Verify ground_truth.csv contains all specified bottleneck types and severities"""
    df = pd.read_csv(DATA_DIR / "ground_truth.csv")
    required_cols = ["build_id", "actual_bottleneck", "severity"]
    for col in required_cols:
        assert col in df.columns

    expected_bottlenecks = {
        "CACHE_PROBLEM", "PARALLELISATION_PROBLEM", "QUEUE_CONGESTION",
        "SLOW_TASK", "RESOURCE_BOTTLENECK", "NORMAL"
    }
    present_bottlenecks = set(df["actual_bottleneck"].unique())
    assert expected_bottlenecks == present_bottlenecks

    expected_severities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    present_severities = set(df["severity"].unique())
    assert expected_severities == present_severities
