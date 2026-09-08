"""
Unit tests for CI dataset generation and schema validation.
"""
import pytest
import pandas as pd
from backend.app.config import RAW_DATA_PATH, PROCESSED_DATA_PATH

def test_raw_dataset_exists_and_valid():
    assert RAW_DATA_PATH.exists(), f"Raw dataset not found at {RAW_DATA_PATH}"
    df = pd.read_csv(RAW_DATA_PATH)
    assert len(df) >= 2000, f"Expected at least 2000 rows, got {len(df)}"
    
    required_cols = [
        "build_id", "pipeline_id", "task_name", "task_category",
        "task_duration_seconds", "queue_time_seconds", "cache_hits",
        "cache_misses", "cache_hit_rate", "agent_utilisation_percent",
        "number_of_tasks", "failed_tasks", "parallelizable_tasks",
        "build_duration_seconds", "build_status", "bottleneck_label",
        "bottleneck_type", "severity"
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column: {col}"

def test_realistic_distributions():
    df = pd.read_csv(RAW_DATA_PATH)
    # Check that labels are not completely one class (realistic balance)
    bottleneck_ratio = df["bottleneck_label"].mean()
    assert 0.15 <= bottleneck_ratio <= 0.85, f"Unbalanced labels: {bottleneck_ratio}"
    
    # Check that high queue time has higher likelihood of bottleneck label
    high_queue = df[df["queue_time_seconds"] > 300]
    low_queue = df[df["queue_time_seconds"] <= 300]
    if len(high_queue) > 0 and len(low_queue) > 0:
        assert high_queue["bottleneck_label"].mean() > low_queue["bottleneck_label"].mean()
