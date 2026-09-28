"""
API Endpoint Test Suite for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database is initialized with telemetry data before tests run"""
    init_db()

@pytest.fixture
def client():
    """FastAPI TestClient fixture"""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    """Verify /health endpoint returns exact required schema"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "healthy",
        "service": "CI Bottleneck Analyser"
    }


def test_organisations_endpoint(client):
    """Verify /organisations returns summary for all organisations"""
    response = client.get("/organisations")
    assert response.status_code == 200
    orgs = response.json()
    assert len(orgs) >= 3
    org_ids = [o["organisation_id"] for o in orgs]
    assert "Org_A" in org_ids
    assert "Org_B" in org_ids
    assert "Org_C" in org_ids

    # Verify summary fields
    first_org = orgs[0]
    assert "total_builds" in first_org
    assert first_org["total_builds"] > 0
    assert "projects" in first_org
    assert len(first_org["projects"]) > 0
    assert "avg_duration_seconds" in first_org
    assert "avg_queue_time_seconds" in first_org


def test_builds_list_and_pagination(client):
    """Verify /builds pagination and response structure"""
    response = client.get("/builds?limit=10&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert data["total"] >= 1000
    assert "builds" in data
    assert len(data["builds"]) == 10
    
    first_build = data["builds"][0]
    assert "build_id" in first_build
    assert "organisation_id" in first_build
    assert "project_id" in first_build
    assert "total_duration_seconds" in first_build
    assert "queue_time_seconds" in first_build


def test_builds_filtering_by_organisation(client):
    """Verify /builds filters correctly by organisation_id"""
    response = client.get("/builds?organisation_id=Org_A&limit=20")
    assert response.status_code == 200
    data = response.json()
    for build in data["builds"]:
        assert build["organisation_id"] == "Org_A"


def test_build_detail_existing(client):
    """Verify /builds/{build_id} returns complete telemetry for existing build"""
    # First fetch a valid build_id
    list_res = client.get("/builds?limit=1")
    build_id = list_res.json()["builds"][0]["build_id"]

    detail_res = client.get(f"/builds/{build_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()

    assert "build" in detail
    assert detail["build"]["build_id"] == build_id
    assert "tasks" in detail
    assert len(detail["tasks"]) > 0
    assert "cache_events" in detail
    assert "agent_utilisation" in detail
    assert "ground_truth" in detail


def test_build_detail_missing_404_handling(client):
    """Verify /builds/{build_id} returns 404 with error message for non-existent build"""
    non_existent_id = "BUILD-DOES-NOT-EXIST-9999"
    response = client.get(f"/builds/{non_existent_id}")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert non_existent_id in data["detail"]
