"""
Rule 1: Long Queue Bottleneck Detector.
Detects builds delayed in the CI queue prior to agent execution.
"""
from typing import Optional, Dict, Any
from backend.app.config import THRESHOLDS

class QueueRule:
    def __init__(self, threshold: float = THRESHOLDS.QUEUE_TIME_THRESHOLD):
        self.threshold = threshold

    def evaluate(self, build_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        queue_time = build_record.get("queue_time_seconds")
        
        # Edge Case handling: queue time missing or None
        if queue_time is None:
            return {
                "detected": False,
                "problem": "QUEUE_BOTTLENECK",
                "severity": "NONE",
                "message": "Queue time information is missing."
            }
            
        queue_time = float(queue_time)
        
        if queue_time > self.threshold:
            # Determine severity based on how far above threshold
            ratio = queue_time / self.threshold
            if ratio >= 2.0:
                severity = "CRITICAL"
                impact = f"High latency overhead. Delaying build start by ~{round(queue_time / 60, 1)} minutes."
            elif ratio >= 1.3:
                severity = "HIGH"
                impact = f"Moderate latency overhead. Waiting in queue for {round(queue_time, 1)} seconds."
            else:
                severity = "MEDIUM"
                impact = f"Queue time is slightly above the {self.threshold}s threshold."

            return {
                "detected": True,
                "problem": "QUEUE_BOTTLENECK",
                "severity": severity,
                "observed_value": f"{round(queue_time, 1)} seconds",
                "threshold": f"{self.threshold} seconds",
                "evidence": {
                    "queue_time_seconds": queue_time,
                    "threshold_seconds": self.threshold,
                    "excess_wait_seconds": round(queue_time - self.threshold, 1),
                    "pipeline_id": build_record.get("pipeline_id", "N/A")
                },
                "recommendation": "The build spent a long time waiting before execution. Consider increasing CI capacity or distributing jobs across available agents.",
                "estimated_impact": impact
            }
            
        return None
