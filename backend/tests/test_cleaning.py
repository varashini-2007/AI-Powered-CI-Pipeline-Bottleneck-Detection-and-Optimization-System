"""
Unit tests for data cleaning and preprocessing.
"""
import pytest
import pandas as pd
import numpy as np
from backend.app.preprocessor import DataCleaner

def test_data_cleaning_deduplication():
    cleaner = DataCleaner()
    sample = pd.DataFrame([
        {
            "build_id": "BUILD-1", "pipeline_id": "P1", "task_name": "compile",
            "task_category": "compile", "task_duration_seconds": 100.0,
            "queue_time_seconds": 50.0, "cache_hits": 10, "cache_misses": 5,
            "cache_hit_rate": 0.66, "agent_utilisation_percent": 0.5,
            "number_of_tasks": 5, "failed_tasks": 0, "parallelizable_tasks": 2,
            "build_duration_seconds": 250.0, "build_status": "SUCCESS",
            "bottleneck_label": 0, "bottleneck_type": "NONE", "severity": "NONE"
        }
    ] * 3)  # 3 duplicates
    
    cleaned_df, report = cleaner.clean(sample)
    assert len(cleaned_df) == 1
    assert report["duplicates_removed"] == 2

def test_negative_duration_handling():
    cleaner = DataCleaner()
    sample = pd.DataFrame([
        {
            "build_id": "BUILD-1", "pipeline_id": "P1", "task_name": "compile",
            "task_category": "compile", "task_duration_seconds": -99.0,
            "queue_time_seconds": -50.0, "cache_hits": 10, "cache_misses": 5,
            "cache_hit_rate": 0.66, "agent_utilisation_percent": 0.5,
            "number_of_tasks": 5, "failed_tasks": 0, "parallelizable_tasks": 2,
            "build_duration_seconds": -150.0, "build_status": "SUCCESS",
            "bottleneck_label": 0, "bottleneck_type": "NONE", "severity": "NONE"
        }
    ])
    cleaned_df, report = cleaner.clean(sample)
    assert cleaned_df["task_duration_seconds"].iloc[0] > 0
    assert cleaned_df["queue_time_seconds"].iloc[0] >= 0
    assert cleaned_df["build_duration_seconds"].iloc[0] > 0
    assert report["negative_task_durations_rectified"] == 1

def test_range_validation():
    cleaner = DataCleaner()
    sample = pd.DataFrame([
        {
            "build_id": "BUILD-1", "pipeline_id": "P1", "task_name": "compile",
            "task_category": "compile", "task_duration_seconds": 100.0,
            "queue_time_seconds": 50.0, "cache_hits": 10, "cache_misses": 5,
            "cache_hit_rate": 1.75, "agent_utilisation_percent": 2.5,
            "number_of_tasks": 5, "failed_tasks": -3, "parallelizable_tasks": -1,
            "build_duration_seconds": 250.0, "build_status": "SUCCESS",
            "bottleneck_label": 0, "bottleneck_type": "NONE", "severity": "NONE"
        }
    ])
    cleaned_df, _ = cleaner.clean(sample)
    assert cleaned_df["cache_hit_rate"].iloc[0] <= 1.0
    assert cleaned_df["agent_utilisation_percent"].iloc[0] <= 1.0
    assert cleaned_df["failed_tasks"].iloc[0] >= 0
    assert cleaned_df["parallelizable_tasks"].iloc[0] >= 0
