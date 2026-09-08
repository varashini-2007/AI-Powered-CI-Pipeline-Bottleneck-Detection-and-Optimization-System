"""
Bottleneck Detection Foundation Interface for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises

Defines modular analytical signatures and detection rule structures
for upcoming rule engine and machine learning phases.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from backend.models import BuildDetail


@dataclass
class BottleneckDetectionResult:
    """Structure representing a detected bottleneck candidate"""
    bottleneck_type: str
    severity: str
    confidence: float
    summary: str
    metrics_evidence: Dict[str, Any]


class BaseBottleneckDetector:
    """Base interface for specialized bottleneck detection rules"""
    
    def __init__(self, name: str):
        self.name = name

    def evaluate(self, build_detail: BuildDetail) -> Optional[BottleneckDetectionResult]:
        """
        Evaluate telemetry for a given build to detect bottlenecks.
        To be expanded in subsequent optimization phases.
        """
        raise NotImplementedError("Subclasses must implement evaluate()")


class QueueCongestionDetector(BaseBottleneckDetector):
    """Detects prolonged queue wait delays caused by agent starvation"""
    
    def __init__(self, threshold_seconds: float = 300.0):
        super().__init__("QueueCongestionDetector")
        self.threshold_seconds = threshold_seconds

    def evaluate(self, build_detail: BuildDetail) -> Optional[BottleneckDetectionResult]:
        queue_sec = build_detail.build.queue_time_seconds
        if queue_sec >= self.threshold_seconds:
            return BottleneckDetectionResult(
                bottleneck_type="QUEUE_CONGESTION",
                severity="HIGH" if queue_sec < 450 else "CRITICAL",
                confidence=0.95,
                summary=f"Build queued for {queue_sec:.1f}s before agent allocation.",
                metrics_evidence={"queue_time_seconds": queue_sec, "threshold": self.threshold_seconds}
            )
        return None


class CacheEfficiencyDetector(BaseBottleneckDetector):
    """Detects poor cache efficiency and high miss penalties"""

    def __init__(self, min_hit_rate: float = 0.50):
        super().__init__("CacheEfficiencyDetector")
        self.min_hit_rate = min_hit_rate

    def evaluate(self, build_detail: BuildDetail) -> Optional[BottleneckDetectionResult]:
        events = build_detail.cache_events
        if not events:
            return None
        hits = sum(1 for e in events if e.cache_status == "HIT")
        hit_rate = hits / len(events)
        if hit_rate < self.min_hit_rate:
            return BottleneckDetectionResult(
                bottleneck_type="CACHE_PROBLEM",
                severity="HIGH" if hit_rate < 0.25 else "MEDIUM",
                confidence=0.90,
                summary=f"Cache hit rate is {hit_rate * 100:.1f}%, below target {self.min_hit_rate * 100:.1f}%.",
                metrics_evidence={"hit_rate": hit_rate, "total_events": len(events), "hits": hits}
            )
        return None
