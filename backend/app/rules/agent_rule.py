"""
Rule 4: Agent Utilisation Bottleneck Detector.
Detects heavily overloaded CI runners/agents that induce queuing and slowdowns.
"""
from typing import Optional, Dict, Any
from backend.app.config import THRESHOLDS

class AgentRule:
    def __init__(self, threshold: float = THRESHOLDS.AGENT_UTILISATION_THRESHOLD):
        self.threshold = threshold
        self.total_affected_builds = 0

    def set_affected_builds_count(self, count: int):
        self.total_affected_builds = count

    def evaluate(self, build_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        agent_utilisation = build_record.get("agent_utilisation_percent")
        if agent_utilisation is None:
            return None
            
        agent_utilisation = float(agent_utilisation)
        
        if agent_utilisation > self.threshold:
            severity = "CRITICAL" if agent_utilisation > 0.95 else "HIGH"
            
            return {
                "detected": True,
                "problem": "AGENT_UTILISATION",
                "severity": severity,
                "observed_value": f"{round(agent_utilisation * 100, 1)}%",
                "threshold": f"{int(self.threshold * 100)}%",
                "evidence": {
                    "agent_utilisation": round(agent_utilisation, 4),
                    "threshold_utilisation": self.threshold,
                    "excess_utilisation_percent": round((agent_utilisation - self.threshold) * 100, 1),
                    "affected_builds_in_cohort": max(1, self.total_affected_builds)
                },
                "recommendation": "The CI agent is heavily utilised and may be contributing to waiting time. Consider balancing workloads or increasing capacity.",
                "estimated_impact": f"Agent operating at {round(agent_utilisation * 100, 1)}% capacity causes runner contention and thread starving."
            }

        return None
