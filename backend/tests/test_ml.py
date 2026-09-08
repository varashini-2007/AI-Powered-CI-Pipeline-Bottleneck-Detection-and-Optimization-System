"""
Unit tests for ML prediction, model evaluation, and error analysis.
"""
import pytest
from backend.app.ml.predict import MLPredictor
from backend.app.config import METRICS_FILE_PATH
import json

def test_ml_prediction_inference():
    predictor = MLPredictor()
    sample = {
        "queue_time_seconds": 500.0,
        "task_duration_seconds": 300.0,
        "cache_hit_rate": 0.1,
        "agent_utilisation_percent": 0.95,
        "number_of_tasks": 6,
        "failed_tasks": 1,
        "parallelizable_tasks": 2,
        "build_duration_seconds": 700.0
    }
    result = predictor.predict(sample)
    assert "prediction" in result
    assert result["prediction"] in [0, 1]
    assert "prediction_label" in result
    assert "bottleneck_probability" in result
    assert 0.0 <= result["bottleneck_probability"] <= 1.0
    assert "feature_contributions" in result
    assert len(result["feature_contributions"]) > 0

def test_ml_metrics_and_error_analysis():
    assert METRICS_FILE_PATH.exists()
    with open(METRICS_FILE_PATH, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    assert "selected_model" in metrics
    assert "metrics" in metrics
    m = metrics["metrics"]
    assert "accuracy" in m
    assert "precision" in m
    assert "recall" in m
    assert "f1_score" in m

    # Validate error analysis
    assert "error_analysis" in metrics
    ea = metrics["error_analysis"]
    assert "false_positives_count" in ea
    assert "false_negatives_count" in ea
    assert "fp_examples" in ea
    assert "fn_examples" in ea
    assert "confusion_matrix" in metrics
