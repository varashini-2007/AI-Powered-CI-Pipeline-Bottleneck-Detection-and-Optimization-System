"""
Data Models and Role-Based Access Control Foundation for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """Supported Enterprise Roles for Regulated CI/CD Environments"""
    DEVELOPER = "Developer"
    ENGINEERING_MANAGER = "Engineering Manager"
    COMPLIANCE_REVIEWER = "Compliance Reviewer"
    EXTERNAL_PARTNER = "External Partner"
    ADMIN = "Admin"


class RolePermissionContext(BaseModel):
    """Role-based permission context defining data visibility and action rights"""
    role: UserRole
    organisation_id: Optional[str] = None
    can_view_telemetry: bool = True
    can_view_financial_impact: bool = False
    can_view_compliance_evidence: bool = False
    can_modify_rules: bool = False
    can_export_audit_report: bool = False

    @classmethod
    def create_for_role(cls, role: UserRole, organisation_id: Optional[str] = None) -> "RolePermissionContext":
        """Factory creating role permissions according to enterprise compliance policy"""
        if role == UserRole.ADMIN:
            return cls(
                role=role,
                organisation_id=organisation_id,
                can_view_telemetry=True,
                can_view_financial_impact=True,
                can_view_compliance_evidence=True,
                can_modify_rules=True,
                can_export_audit_report=True
            )
        elif role == UserRole.COMPLIANCE_REVIEWER:
            return cls(
                role=role,
                organisation_id=organisation_id,
                can_view_telemetry=True,
                can_view_financial_impact=True,
                can_view_compliance_evidence=True,
                can_modify_rules=False,
                can_export_audit_report=True
            )
        elif role == UserRole.ENGINEERING_MANAGER:
            return cls(
                role=role,
                organisation_id=organisation_id,
                can_view_telemetry=True,
                can_view_financial_impact=True,
                can_view_compliance_evidence=True,
                can_modify_rules=False,
                can_export_audit_report=True
            )
        elif role == UserRole.DEVELOPER:
            return cls(
                role=role,
                organisation_id=organisation_id,
                can_view_telemetry=True,
                can_view_financial_impact=False,
                can_view_compliance_evidence=False,
                can_modify_rules=False,
                can_export_audit_report=False
            )
        elif role == UserRole.EXTERNAL_PARTNER:
            # Masked view with restricted organisation scope
            return cls(
                role=role,
                organisation_id=organisation_id,
                can_view_telemetry=True,
                can_view_financial_impact=False,
                can_view_compliance_evidence=False,
                can_modify_rules=False,
                can_export_audit_report=False
            )
        return cls(role=role, organisation_id=organisation_id)


class Build(BaseModel):
    """Build telemetry record"""
    build_id: str
    organisation_id: str
    project_id: str
    build_status: str
    start_time: str
    end_time: str
    total_duration_seconds: float
    queue_time_seconds: float
    agent_id: str


class TaskTiming(BaseModel):
    """Task timing and parallelisability record"""
    build_id: str
    task_name: str
    duration_seconds: float
    dependency_group: str
    parallelisable: bool


class CacheEvent(BaseModel):
    """Build cache event telemetry"""
    build_id: str
    task_name: str
    cache_status: str
    cache_key: str


class AgentUtilisation(BaseModel):
    """Agent host resource saturation telemetry"""
    build_id: str
    agent_id: str
    cpu_utilisation: float
    memory_utilisation: float
    busy_percentage: float
    available_agents: int


class GroundTruth(BaseModel):
    """Benchmark bottleneck ground truth label and severity"""
    build_id: str
    actual_bottleneck: str
    severity: str


class BuildDetail(BaseModel):
    """Comprehensive build detail response with associated tasks and telemetry"""
    build: Build
    tasks: List[TaskTiming] = []
    cache_events: List[CacheEvent] = []
    agent_utilisation: Optional[AgentUtilisation] = None
    ground_truth: Optional[GroundTruth] = None


class OrganisationSummary(BaseModel):
    """Aggregated organisation statistics and project summary"""
    organisation_id: str
    total_builds: int
    projects: List[str]
    avg_duration_seconds: float
    avg_queue_time_seconds: float
    success_rate_percent: float
    bottleneck_distribution: Dict[str, int] = {}
