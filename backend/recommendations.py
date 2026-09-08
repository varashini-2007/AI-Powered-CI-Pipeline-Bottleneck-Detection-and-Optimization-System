"""
Advisory Recommendation Foundation for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises

Defines evidence-based recommendation schemas and non-specialist explainability
interfaces for enterprise compliance and review.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RecommendationEvidence(BaseModel):
    """Supporting empirical telemetry evidence for compliance and peer review"""
    metric_name: str
    observed_value: Any
    recommended_threshold: Any
    estimated_time_saving_seconds: Optional[float] = None


class AdvisoryRecommendation(BaseModel):
    """
    Evidence-based recommendation framed for non-specialist reviewers
    and engineering managers.
    """
    recommendation_id: str
    build_id: str
    category: str  # Caching, Parallelisation, Queue Scaling, Resource Tuning
    priority: str  # LOW, MEDIUM, HIGH, CRITICAL

    # 4-Question Plain Language Explainability Framework
    what_happened: str
    why_it_matters: str
    what_should_be_done: str
    evidence: List[RecommendationEvidence] = []
    
    # Audit & Compliance
    is_advisory_only: bool = True
    requires_security_approval: bool = False


class RecommendationEngineFoundation:
    """
    Base service for advisory recommendation generation.
    Full heuristic and ML recommendations will be implemented in subsequent phases.
    """
    
    def generate_recommendations(self, build_id: str) -> List[AdvisoryRecommendation]:
        """Advisory recommendation generator stub for current phase"""
        return []
