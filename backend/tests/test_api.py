"""
API integration tests for FastAPI backend endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_builds" in data
    assert data["total_builds"] > 0
    assert "bottlenecks_found" in data
    assert "high_priority_issues" in data
    assert "avg_queue_time_seconds" in data
    assert "avg_cache_hit_rate" in data
    assert "avg_build_duration_seconds" in data

def test_builds_list():
    response = client.get("/api/builds?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "build_id" in data[0]

def test_bottlenecks_list():
    response = client.get("/api/bottlenecks?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "problem" in data[0]

def test_recommendations_list_and_detail():
    response = client.get("/api/recommendations?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    rec_id = data[0]["recommendation_id"]
    detail_res = client.get(f"/api/recommendations/{rec_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["recommendation_id"] == rec_id
    assert "explanation" in detail
    assert "what_happened" in detail["explanation"]
    assert "evidence" in detail

def test_ml_predict_endpoint():
    payload = {
        "queue_time_seconds": 400.0,
        "task_duration_seconds": 250.0,
        "cache_hit_rate": 0.2,
        "agent_utilisation_percent": 0.92,
        "number_of_tasks": 8,
        "failed_tasks": 0,
        "parallelizable_tasks": 2,
        "build_duration_seconds": 550.0
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert data["prediction"] in [0, 1]
    assert "prediction_label" in data
    assert "bottleneck_probability" in data
    assert "model_used" in data

def test_ml_metrics_endpoint():
    response = client.get("/api/ml/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "confusion_matrix" in data
    assert "error_analysis" in data
