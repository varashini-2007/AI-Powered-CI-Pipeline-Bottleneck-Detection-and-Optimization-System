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

def test_api_organisations_and_role_isolation():
    # Admin / Default sees all 3 orgs
    response = client.get("/api/organisations")
    assert response.status_code == 200
    orgs = response.json()
    assert len(orgs) == 3
    org_ids = [o["organisation_id"] for o in orgs]
    assert "Org_A" in org_ids and "Org_B" in org_ids and "Org_C" in org_ids

    # External Partner is isolated to Org_C
    partner_res = client.get("/api/organisations", headers={"X-User-Role": "External Partner"})
    assert partner_res.status_code == 200
    partner_orgs = partner_res.json()
    assert len(partner_orgs) == 1
    assert partner_orgs[0]["organisation_id"] == "Org_C"

def test_experiment_metrics_feedback_reduction():
    response = client.get("/api/experiment/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    m = data["metrics"]
    assert m["baseline_median_feedback_time_minutes"] == 38.5
    assert m["target_median_feedback_time_minutes"] == 12.0
    assert m["measured_result_minutes"] == 11.2
    assert m["feedback_time_reduction_percent"] >= 70.0
    assert m["target_exceeded"] is True

def test_ci_webhook_integration_stub():
    payload = {
        "event_type": "workflow_job_completed",
        "provider": "github_actions",
        "repository": "retail-banking/payments-api",
        "organization_id": "Org_A",
        "build_id": "BUILD-GH-TEST-101",
        "queue_time_seconds": 420.0,
        "build_duration_seconds": 960.0,
        "agent_utilisation_percent": 0.94,
        "tasks": [
            {"name": "install_deps", "duration_seconds": 180.0, "cache_hit": False, "parallelisable": False},
            {"name": "unit_tests", "duration_seconds": 240.0, "cache_hit": True, "parallelisable": True},
            {"name": "sast_scan", "duration_seconds": 230.0, "cache_hit": True, "parallelisable": True}
        ]
    }
    response = client.post("/api/ci/webhook", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processed"
    assert data["build_id"] == "BUILD-GH-TEST-101"
    assert "evidence_sha256_hash" in data
    assert len(data["evidence_sha256_hash"]) == 64
    assert len(data["detected_bottlenecks"]) > 0
    assert len(data["recommendations"]) > 0
    assert "compliance_audit_record" in data

def test_stakeholder_validation_endpoint():
    response = client.get("/api/stakeholders/validation")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_satisfaction_score"] >= 4.5
    assert len(data["reviews"]) == 4
    personas = [r["persona_id"] for r in data["reviews"]]
    assert "developer" in personas
    assert "manager" in personas
    assert "compliance" in personas
    assert "external_partner" in personas

def test_thresholds_inspection_and_update():
    get_res = client.get("/api/thresholds")
    assert get_res.status_code == 200
    th = get_res.json()
    assert "QUEUE_TIME_THRESHOLD" in th

    post_res = client.post("/api/thresholds?queue_threshold=280.0")
    assert post_res.status_code == 200
    updated = post_res.json()["current_thresholds"]
    assert updated["QUEUE_TIME_THRESHOLD"] == 280.0

