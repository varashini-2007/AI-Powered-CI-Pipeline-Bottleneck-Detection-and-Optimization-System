"""
FastAPI Application Entrypoint for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises

Endpoints:
  GET /health            - System health status
  GET /organisations      - Multi-organisation telemetry and summary metrics
  GET /builds            - Filtered & paginated build records
  GET /builds/{build_id} - Detailed task breakdown, cache events, agent utilisation, and ground truth
"""

import os
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.models import (
    Build, BuildDetail, OrganisationSummary, UserRole, RolePermissionContext
)
from backend.database import (
    init_db, get_organisations, get_builds, get_build_by_id
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="CI Insight: Intelligent CI Bottleneck Analyser",
    description="Initial foundation and telemetry API for regulated enterprise CI pipelines.",
    version="1.0.0-foundation",
    lifespan=lifespan
)

# Enable CORS for local development and dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """
    Health check endpoint returning exact service specification.
    """
    return {
        "status": "healthy",
        "service": "CI Bottleneck Analyser"
    }


@app.get("/organisations", response_model=List[OrganisationSummary])
def list_organisations(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_org: Optional[str] = Header(None, alias="X-User-Org")
):
    """
    Retrieve summary telemetry and project lists for all organisations.
    Enforces enterprise multi-tenant isolation if X-User-Org is specified.
    """
    summaries = get_organisations()
    if x_user_org and x_user_role != UserRole.ADMIN:
        summaries = [s for s in summaries if s.organisation_id == x_user_org]
    return summaries


@app.get("/builds")
def list_builds(
    organisation_id: Optional[str] = Query(None, description="Filter by organisation (e.g. Org_A, Org_B, Org_C)"),
    project_id: Optional[str] = Query(None, description="Filter by project repository name"),
    build_status: Optional[str] = Query(None, description="Filter by status: SUCCESS, FAILED, CANCELLED"),
    limit: int = Query(50, ge=1, le=500, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_org: Optional[str] = Header(None, alias="X-User-Org")
):
    """
    Retrieve paginated build telemetry records with optional filters.
    """
    # Enforce organisation boundary if header present and not admin
    effective_org = organisation_id
    if x_user_org and x_user_role != UserRole.ADMIN:
        effective_org = x_user_org

    total_count, builds = get_builds(
        organisation_id=effective_org,
        project_id=project_id,
        build_status=build_status,
        limit=limit,
        offset=offset
    )

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "builds": builds
    }


@app.get("/builds/{build_id}", response_model=BuildDetail)
def get_build_details(build_id: str):
    """
    Retrieve comprehensive task timings, cache events, agent saturation,
    and ground truth bottleneck diagnostics for a specific build.
    Returns 404 if the build_id does not exist.
    """
    detail = get_build_by_id(build_id)
    if not detail:
        raise HTTPException(
            status_code=404,
            detail=f"Build with ID '{build_id}' was not found in CI telemetry database."
        )
    return detail


# Mount frontend if built
BASE_DIR = Path(__file__).resolve().parent.parent
dist_dir = BASE_DIR / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("health") or full_path.startswith("builds") or full_path.startswith("organisations") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
