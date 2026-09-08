"""
Rule 2: Low Cache Hit Rate Detector.
Detects inefficient cache utilization or missing cache configurations.
Edge Case 1: If cache data is missing or None, handles gracefully without crashing.
"""
from typing import Optional, Dict, Any
from backend.app.config import THRESHOLDS

class CacheRule:
    def __init__(self, threshold: float = THRESHOLDS.CACHE_HIT_RATE_THRESHOLD):
        self.threshold = threshold

    def evaluate(self, build_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        cache_hit_rate = build_record.get("cache_hit_rate")
        cache_hits = build_record.get("cache_hits")
        cache_misses = build_record.get("cache_misses")

        # Edge Case 1: Missing cache data
        if cache_hit_rate is None or (cache_hits is None and cache_misses is None):
            return {
                "detected": False,
                "problem": "CACHE_DATA_MISSING",
                "severity": "LOW",
                "observed_value": "Missing",
                "threshold": f"{int(self.threshold * 100)}%",
                "evidence": {
                    "cache_hit_rate": None,
                    "cache_hits": None,
                    "cache_misses": None
                },
                "recommendation": "Cache analysis unavailable because cache information is missing.",
                "estimated_impact": "Cannot assess caching benefits without cache telemetry."
            }

        cache_hit_rate = float(cache_hit_rate)
        cache_hits = int(cache_hits or 0)
        cache_misses = int(cache_misses or 0)
        total_ops = cache_hits + cache_misses

        # If step has 0 total cache operations, caching is not applicable for this task
        if total_ops == 0:
            return None

        if cache_hit_rate < self.threshold:
            severity = "HIGH" if cache_hit_rate < 0.25 else "MEDIUM"
            return {
                "detected": True,
                "problem": "LOW_CACHE_EFFICIENCY",
                "severity": severity,
                "observed_value": f"{round(cache_hit_rate * 100, 1)}%",
                "threshold": f"{int(self.threshold * 100)}%",
                "evidence": {
                    "cache_hits": cache_hits,
                    "cache_misses": cache_misses,
                    "cache_hit_rate": round(cache_hit_rate, 4),
                    "threshold_rate": self.threshold,
                    "potential_avoidable_misses": cache_misses
                },
                "recommendation": "A large amount of build data was not reused from the cache. Improving caching may reduce repeated downloads or rebuilds.",
                "estimated_impact": f"Up to {cache_misses} artifact downloads/rebuilds could be saved by caching dependencies and build artifacts."
            }

        return None
