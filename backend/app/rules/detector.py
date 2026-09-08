"""
Rule Engine Orchestrator.
Combines all bottleneck detection rules and returns structured findings.
"""
from typing import List, Dict, Any, Optional
import pandas as pd
from backend.app.rules.queue_rule import QueueRule
from backend.app.rules.cache_rule import CacheRule
from backend.app.rules.slow_task_rule import SlowTaskRule
from backend.app.rules.agent_rule import AgentRule
from backend.app.rules.parallel_rule import ParallelRule

class BottleneckDetector:
    def __init__(self, historical_df: Optional[pd.DataFrame] = None):
        self.queue_rule = QueueRule()
        self.cache_rule = CacheRule()
        self.slow_task_rule = SlowTaskRule()
        self.agent_rule = AgentRule()
        self.parallel_rule = ParallelRule()

        if historical_df is not None and not historical_df.empty:
            self.slow_task_rule.update_statistics(historical_df)
            # Count agent overload builds
            if "agent_utilisation_percent" in historical_df.columns:
                overloaded = int((historical_df["agent_utilisation_percent"] > 0.90).sum())
                self.agent_rule.set_affected_builds_count(overloaded)

    def analyze_record(self, record: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run all rules against a build/task record and return detected bottlenecks."""
        findings = []

        rules = [
            self.queue_rule,
            self.cache_rule,
            self.slow_task_rule,
            self.agent_rule,
            self.parallel_rule
        ]

        for rule in rules:
            result = rule.evaluate(record)
            if result is not None and result.get("detected", False):
                findings.append(result)
            elif result is not None and result.get("problem") == "CACHE_DATA_MISSING":
                # Special handling for edge case 1
                findings.append(result)

        return findings
