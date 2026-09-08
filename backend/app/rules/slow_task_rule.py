"""
Rule 3: Slow Task Bottleneck Detector.
Identifies tasks whose execution duration exceeds the 90th percentile of task durations.
Edge Case 2: Extremely slow tasks are caught and flagged with CRITICAL severity.
"""
from typing import Optional, Dict, Any
import numpy as np
import pandas as pd
from backend.app.config import THRESHOLDS

class SlowTaskRule:
    def __init__(self, p90_threshold: float = 210.0, median_duration: float = 75.0):
        self.p90_threshold = p90_threshold
        self.median_duration = median_duration

    def update_statistics(self, df: pd.DataFrame):
        """Update historical statistics dynamically from dataset."""
        if df is not None and not df.empty and "task_duration_seconds" in df.columns:
            valid_durations = df["task_duration_seconds"].dropna()
            if len(valid_durations) > 0:
                self.p90_threshold = float(np.percentile(valid_durations, THRESHOLDS.SLOW_TASK_PERCENTILE))
                self.median_duration = float(valid_durations.median())

    def evaluate(self, build_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        task_duration = build_record.get("task_duration_seconds")
        if task_duration is None:
            return None
            
        task_duration = float(task_duration)
        task_name = build_record.get("task_name", "unknown_task")

        # Edge Case 2: Extremely slow task (e.g. > 450s or 3x p90)
        is_extreme = task_duration >= (self.p90_threshold * 2.0) or task_duration >= 450.0

        if task_duration > self.p90_threshold or is_extreme:
            diff_from_normal = round(task_duration - self.median_duration, 2)
            
            if is_extreme:
                severity = "CRITICAL"
                impact = f"Critical bottleneck: Takes {diff_from_normal}s longer than median and accounts for major build stall."
            elif task_duration > (self.p90_threshold * 1.3):
                severity = "HIGH"
                impact = f"High runtime: Exceeds 90th percentile ({round(self.p90_threshold, 1)}s) by {round(task_duration - self.p90_threshold, 1)}s."
            else:
                severity = "MEDIUM"
                impact = f"Above 90th percentile threshold by {round(task_duration - self.p90_threshold, 1)}s."

            return {
                "detected": True,
                "problem": "SLOW_TASK",
                "severity": severity,
                "observed_value": f"{round(task_duration, 1)} seconds",
                "threshold": f"{round(self.p90_threshold, 1)} seconds (90th percentile)",
                "evidence": {
                    "task_name": task_name,
                    "task_duration_seconds": task_duration,
                    "median_duration_seconds": round(self.median_duration, 1),
                    "p90_threshold_seconds": round(self.p90_threshold, 1),
                    "difference_from_normal_seconds": diff_from_normal
                },
                "recommendation": "This task takes significantly longer than most tasks and should be investigated.",
                "estimated_impact": impact
            }

        return None
