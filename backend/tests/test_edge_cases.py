"""
Unit tests for the three mandatory edge cases:
1. Missing cache data
2. Extremely slow task
3. No parallelisation opportunity
"""
import pytest
from backend.app.rules.cache_rule import CacheRule
from backend.app.rules.slow_task_rule import SlowTaskRule
from backend.app.rules.parallel_rule import ParallelRule
from backend.app.rules.detector import BottleneckDetector

def test_edge_case_1_missing_cache_data():
    """Edge Case 1: Missing cache data must not crash and output expected message."""
    rule = CacheRule()
    record = {
        "build_id": "BUILD-EDGE-1",
        "cache_hit_rate": None,
        "cache_hits": None,
        "cache_misses": None
    }
    
    # Must not throw exception
    res = rule.evaluate(record)
    assert res is not None
    assert res["problem"] == "CACHE_DATA_MISSING"
    assert "Cache analysis unavailable because cache information is missing." in res["recommendation"]

def test_edge_case_2_extremely_slow_task():
    """Edge Case 2: Extremely slow task must be identified as bottleneck."""
    rule = SlowTaskRule(p90_threshold=210.0, median_duration=75.0)
    record = {
        "build_id": "BUILD-EDGE-2",
        "task_name": "massive_e2e_suite",
        "task_duration_seconds": 950.0  # Extremely slow
    }
    
    res = rule.evaluate(record)
    assert res is not None
    assert res["detected"] is True
    assert res["problem"] == "SLOW_TASK"
    assert res["severity"] == "CRITICAL"
    assert res["evidence"]["task_duration_seconds"] == 950.0

def test_edge_case_3_no_parallelisation_opportunity():
    """Edge Case 3: No parallelisation opportunity must NOT recommend parallelisation."""
    rule = ParallelRule(min_tasks=2)
    # 0 or 1 parallelizable task
    record_zero = {
        "build_id": "BUILD-EDGE-3A",
        "parallelizable_tasks": 0,
        "task_duration_seconds": 120.0
    }
    res_zero = rule.evaluate(record_zero)
    assert res_zero is None  # Must NOT recommend parallelisation

    record_single = {
        "build_id": "BUILD-EDGE-3B",
        "parallelizable_tasks": 1,
        "task_duration_seconds": 120.0
    }
    res_single = rule.evaluate(record_single)
    assert res_single is None  # Must NOT recommend parallelisation
