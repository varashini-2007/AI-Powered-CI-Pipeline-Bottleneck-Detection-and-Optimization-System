"""
FastAPI Route Handlers for CI Bottleneck Analyser.
Returns real data from SQLite database and live ML inference services.
"""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.db.session import get_db
from backend.app.models.db_models import Build, Bottleneck, Recommendation
from backend.app.schemas.schemas import (
    BuildResponse,
    BottleneckResponse,
    RecommendationResponse,
    MLPredictRequest,
    MLPredictResponse,
    DashboardSummaryResponse,
    AnalyseBuildResponse
)
from backend.app.ml.predict import MLPredictor
from backend.app.config import METRICS_FILE_PATH
from backend.app.rules.detector import BottleneckDetector
from backend.app.services.recommendation_service import RecommendationService

router = APIRouter()
ml_predictor = MLPredictor()
detector = BottleneckDetector()
rec_service = RecommendationService(detector=detector)

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CI Bottleneck Analyser API",
        "version": "0.5.0-mvp"
    }

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_builds = db.query(func.count(Build.id)).scalar() or 0
    bottlenecks_found = db.query(func.count(Bottleneck.id)).scalar() or 0
    high_priority_issues = db.query(func.count(Bottleneck.id)).filter(
        Bottleneck.severity.in_(["HIGH", "CRITICAL"])
    ).scalar() or 0
    
    avg_queue = db.query(func.avg(Build.queue_time_seconds)).scalar() or 0.0
    avg_cache = db.query(func.avg(Build.cache_hit_rate)).scalar() or 0.0
    avg_duration = db.query(func.avg(Build.build_duration_seconds)).scalar() or 0.0

    # Bottleneck distribution by type
    b_types = db.query(Bottleneck.problem, func.count(Bottleneck.id)).group_by(Bottleneck.problem).all()
    bottleneck_distribution = {b[0]: b[1] for b in b_types}

    # Severity distribution
    sev_types = db.query(Bottleneck.severity, func.count(Bottleneck.id)).group_by(Bottleneck.severity).all()
    severity_distribution = {s[0]: s[1] for s in sev_types}

    return {
        "total_builds": total_builds,
        "bottlenecks_found": bottlenecks_found,
        "high_priority_issues": high_priority_issues,
        "avg_queue_time_seconds": round(float(avg_queue), 2),
        "avg_cache_hit_rate": round(float(avg_cache), 4),
        "avg_build_duration_seconds": round(float(avg_duration), 2),
        "bottleneck_distribution": bottleneck_distribution,
        "severity_distribution": severity_distribution
    }

@router.get("/builds", response_model=List[BuildResponse])
def list_builds(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    pipeline_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Build)
    if severity:
        query = query.filter(Build.severity == severity.upper())
    if pipeline_id:
        query = query.filter(Build.pipeline_id == pipeline_id)
        
    builds = query.order_by(Build.id.desc()).offset(offset).limit(limit).all()
    return builds

@router.get("/builds/{build_id}", response_model=List[BuildResponse])
def get_build(build_id: str, db: Session = Depends(get_db)):
    build_tasks = db.query(Build).filter(Build.build_id == build_id).all()
    if not build_tasks:
        raise HTTPException(status_code=404, detail=f"Build {build_id} not found")
    return build_tasks

@router.post("/analyse/{build_id}", response_model=AnalyseBuildResponse)
def analyse_build(build_id: str, db: Session = Depends(get_db)):
    tasks = db.query(Build).filter(Build.build_id == build_id).all()
    if not tasks:
        raise HTTPException(status_code=404, detail=f"Build {build_id} not found for analysis")

    detected_bottlenecks = []
    generated_recommendations = []

    for task in tasks:
        task_dict = {
            "build_id": task.build_id,
            "pipeline_id": task.pipeline_id,
            "task_name": task.task_name,
            "task_category": task.task_category,
            "task_duration_seconds": task.task_duration_seconds,
            "queue_time_seconds": task.queue_time_seconds,
            "cache_hits": task.cache_hits,
            "cache_misses": task.cache_misses,
            "cache_hit_rate": task.cache_hit_rate,
            "agent_utilisation_percent": task.agent_utilisation_percent,
            "number_of_tasks": task.number_of_tasks,
            "failed_tasks": task.failed_tasks,
            "parallelizable_tasks": task.parallelizable_tasks,
            "build_duration_seconds": task.build_duration_seconds
        }

        recs = rec_service.generate_recommendations_for_record(task_dict)
        for idx, r in enumerate(recs):
            b_resp = BottleneckResponse(
                id=idx + 1,
                build_id=r["build_id"],
                problem=r["problem"],
                severity=r["severity"],
                observed_value=r["observed_value"],
                threshold=r["threshold"],
                recommendation=r["recommendation"],
                estimated_impact=r.get("estimated_impact")
            )
            detected_bottlenecks.append(b_resp)

            r_resp = RecommendationResponse(
                id=idx + 1,
                recommendation_id=r["recommendation_id"],
                build_id=r["build_id"],
                problem=r["problem"],
                severity=r["severity"],
                observed_value=r["observed_value"],
                threshold=r["threshold"],
                recommendation=r["recommendation"],
                evidence=r["evidence"],
                estimated_impact=r.get("estimated_impact"),
                explanation=r["explanation"]
            )
            generated_recommendations.append(r_resp)

    return {
        "build_id": build_id,
        "bottlenecks_detected": len(detected_bottlenecks),
        "bottlenecks": detected_bottlenecks,
        "recommendations": generated_recommendations
    }

@router.get("/bottlenecks", response_model=List[BottleneckResponse])
def list_bottlenecks(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bottleneck)
    if severity:
        query = query.filter(Bottleneck.severity == severity.upper())
    bottlenecks = query.order_by(Bottleneck.id.desc()).offset(offset).limit(limit).all()
    return bottlenecks

@router.get("/recommendations", response_model=List[RecommendationResponse])
def list_recommendations(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation)
    if severity:
        query = query.filter(Recommendation.severity == severity.upper())
        
    records = query.order_by(Recommendation.id.desc()).offset(offset).limit(limit).all()
    
    responses = []
    for r in records:
        evidence = json.loads(r.evidence_json) if r.evidence_json else {}
        responses.append(RecommendationResponse(
            id=r.id,
            recommendation_id=r.recommendation_id,
            build_id=r.build_id,
            problem=r.problem,
            severity=r.severity,
            observed_value=r.observed_value,
            threshold=r.threshold,
            recommendation=r.recommendation,
            evidence=evidence,
            estimated_impact=r.estimated_impact,
            explanation={
                "what_happened": r.what_happened,
                "why_it_matters": r.why_it_matters,
                "what_to_do": r.what_to_do,
                "evidence_supports": r.evidence_supports
            }
        ))
    return responses

@router.get("/recommendations/{recommendation_id}", response_model=RecommendationResponse)
def get_recommendation(recommendation_id: str, db: Session = Depends(get_db)):
    r = db.query(Recommendation).filter(
        (Recommendation.recommendation_id == recommendation_id) |
        (Recommendation.id == int(recommendation_id) if recommendation_id.isdigit() else False)
    ).first()
    
    if not r:
        raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
        
    evidence = json.loads(r.evidence_json) if r.evidence_json else {}
    return RecommendationResponse(
        id=r.id,
        recommendation_id=r.recommendation_id,
        build_id=r.build_id,
        problem=r.problem,
        severity=r.severity,
        observed_value=r.observed_value,
        threshold=r.threshold,
        recommendation=r.recommendation,
        evidence=evidence,
        estimated_impact=r.estimated_impact,
        explanation={
            "what_happened": r.what_happened,
            "why_it_matters": r.why_it_matters,
            "what_to_do": r.what_to_do,
            "evidence_supports": r.evidence_supports
        }
    )

@router.post("/ml/predict", response_model=MLPredictResponse)
def predict_ml(request: MLPredictRequest):
    try:
        result = ml_predictor.predict(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction failed: {str(e)}")

@router.get("/ml/metrics")
def get_ml_metrics():
    if not METRICS_FILE_PATH.exists():
        raise HTTPException(status_code=404, detail="ML metrics not yet computed. Run ML training pipeline.")
    with open(METRICS_FILE_PATH, "r", encoding="utf-8") as f:
        metrics = json.load(f)
    return metrics
