"""
Unit tests for recommendations and explainability service.
"""
import pytest
from backend.app.services.recommendation_service import RecommendationService
from backend.app.services.explainability_service import ExplainabilityService

def test_recommendation_structure():
    service = RecommendationService()
    record = {
        "build_id": "BUILD-999",
        "pipeline_id": "PIPE-api",
        "task_name": "heavy_test",
        "task_duration_seconds": 320.0,
        "queue_time_seconds": 550.0,
        "cache_hits": 10,
        "cache_misses": 90,
        "cache_hit_rate": 0.10,
        "agent_utilisation_percent": 0.95,
        "number_of_tasks": 10,
        "failed_tasks": 0,
        "parallelizable_tasks": 4,
        "build_duration_seconds": 800.0
    }

    recs = service.generate_recommendations_for_record(record)
    assert len(recs) > 0
    
    for r in recs:
        assert "recommendation_id" in r
        assert "build_id" in r
        assert "problem" in r
        assert "severity" in r
        assert "recommendation" in r
        assert "evidence" in r
        assert "estimated_impact" in r
        assert "explanation" in r
        
        # High priority recommendations MUST contain evidence
        if r["severity"] in ["HIGH", "CRITICAL"]:
            assert bool(r["evidence"]) is True

def test_explainability_service_four_questions():
    explanation = ExplainabilityService.generate_explanation(
        problem="QUEUE_BOTTLENECK",
        severity="HIGH",
        evidence={"queue_time_seconds": 400.0},
        observed_value="400.0 seconds",
        threshold="300.0 seconds"
    )

    assert "what_happened" in explanation
    assert "why_it_matters" in explanation
    assert "what_to_do" in explanation
    assert "evidence_supports" in explanation

    assert "400.0 seconds" in explanation["what_happened"]
    assert len(explanation["why_it_matters"]) > 10
    assert len(explanation["what_to_do"]) > 10
