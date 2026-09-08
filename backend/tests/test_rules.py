"""
Unit tests for rule-based bottleneck detectors:
Queue, Cache, Slow Task, Agent Utilisation, and Parallelisation.
"""
import pytest
from backend.app.rules.queue_rule import QueueRule
from backend.app.rules.cache_rule import CacheRule
from backend.app.rules.slow_task_rule import SlowTaskRule
from backend.app.rules.agent_rule import AgentRule
from backend.app.rules.parallel_rule import ParallelRule

def test_queue_bottleneck_detection():
    rule = QueueRule(threshold=300.0)
    # Exceeds threshold
    res = rule.evaluate({"queue_time_seconds": 450.0, "pipeline_id": "api"})
    assert res is not None
    assert res["detected"] is True
    assert res["problem"] == "QUEUE_BOTTLENECK"
    assert "observed_value" in res
    assert "recommendation" in res
    assert res["evidence"]["queue_time_seconds"] == 450.0

    # Normal queue time
    res_normal = rule.evaluate({"queue_time_seconds": 120.0, "pipeline_id": "api"})
    assert res_normal is None

def test_cache_bottleneck_detection():
    rule = CacheRule(threshold=0.50)
    # Low hit rate (< 50%)
    res = rule.evaluate({"cache_hit_rate": 0.20, "cache_hits": 20, "cache_misses": 80})
    assert res is not None
    assert res["detected"] is True
    assert res["problem"] == "LOW_CACHE_EFFICIENCY"
    assert "cache_misses" in res["evidence"]

    # High hit rate
    res_ok = rule.evaluate({"cache_hit_rate": 0.85, "cache_hits": 85, "cache_misses": 15})
    assert res_ok is None

def test_slow_task_detection():
    rule = SlowTaskRule(p90_threshold=200.0, median_duration=60.0)
    # Slow task
    res = rule.evaluate({"task_name": "integration_suite", "task_duration_seconds": 250.0})
    assert res is not None
    assert res["detected"] is True
    assert res["problem"] == "SLOW_TASK"
    assert res["evidence"]["difference_from_normal_seconds"] == 190.0

    # Fast task
    res_fast = rule.evaluate({"task_name": "lint", "task_duration_seconds": 30.0})
    assert res_fast is None

def test_agent_utilisation_detection():
    rule = AgentRule(threshold=0.90)
    # Overloaded
    res = rule.evaluate({"agent_utilisation_percent": 0.96})
    assert res is not None
    assert res["detected"] is True
    assert res["problem"] == "AGENT_UTILISATION"

    # Normal utilisation
    res_norm = rule.evaluate({"agent_utilisation_percent": 0.65})
    assert res_norm is None

def test_parallelisation_detection():
    rule = ParallelRule(min_tasks=2, min_savings=30.0)
    # Independent tasks opportunity
    res = rule.evaluate({"parallelizable_tasks": 3, "task_duration_seconds": 100.0})
    assert res is not None
    assert res["detected"] is True
    assert res["problem"] == "PARALLELISATION_OPPORTUNITY"
    assert "Potential parallelisation opportunity" in res["recommendation"]
    assert res["evidence"]["estimated_saving_seconds"] > 0
