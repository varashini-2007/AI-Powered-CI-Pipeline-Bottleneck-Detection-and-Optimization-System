"""
Pydantic Data Validation and Response Schemas.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class BuildBase(BaseModel):
    build_id: str
    pipeline_id: str
    task_name: str
    task_category: str
    task_duration_seconds: float
    queue_time_seconds: float
    cache_hits: int
    cache_misses: int
    cache_hit_rate: float
    agent_utilisation_percent: float
    number_of_tasks: int
    failed_tasks: int
    parallelizable_tasks: int
    build_duration_seconds: float
    build_status: str
    bottleneck_label: int
    bottleneck_type: str
    severity: str

class BuildResponse(BuildBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BottleneckResponse(BaseModel):
    id: int
    build_id: str
    problem: str
    severity: str
    observed_value: str
    threshold: str
    recommendation: str
    estimated_impact: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RecommendationExplanation(BaseModel):
    what_happened: str
    why_it_matters: str
    what_to_do: str
    evidence_supports: str

class RecommendationResponse(BaseModel):
    id: int
    recommendation_id: str
    build_id: str
    problem: str
    severity: str
    observed_value: str
    threshold: str
    recommendation: str
    evidence: Dict[str, Any]
    estimated_impact: Optional[str] = None
    explanation: RecommendationExplanation
    model_config = ConfigDict(from_attributes=True)

class MLPredictRequest(BaseModel):
    queue_time_seconds: float = Field(..., ge=0, description="Queue wait time in seconds")
    task_duration_seconds: float = Field(..., ge=0, description="Task execution duration in seconds")
    cache_hit_rate: float = Field(..., ge=0.0, le=1.0, description="Cache hit rate between 0 and 1")
    agent_utilisation_percent: float = Field(..., ge=0.0, le=1.0, description="Agent utilisation between 0 and 1")
    number_of_tasks: int = Field(1, ge=1, description="Total number of tasks in build")
    failed_tasks: int = Field(0, ge=0, description="Number of failed tasks")
    parallelizable_tasks: int = Field(0, ge=0, description="Number of parallelizable tasks")
    build_duration_seconds: float = Field(..., ge=0, description="Total build duration in seconds")

class MLPredictResponse(BaseModel):
    prediction: int
    prediction_label: str
    bottleneck_probability: float
    probability_percent: float
    model_used: str
    feature_contributions: List[Dict[str, Any]]

class DashboardSummaryResponse(BaseModel):
    total_builds: int
    bottlenecks_found: int
    high_priority_issues: int
    avg_queue_time_seconds: float
    avg_cache_hit_rate: float
    avg_build_duration_seconds: float
    bottleneck_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]

class AnalyseBuildResponse(BaseModel):
    build_id: str
    bottlenecks_detected: int
    bottlenecks: List[BottleneckResponse]
    recommendations: List[RecommendationResponse]
