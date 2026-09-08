"""
Rule 5: Parallelisation Opportunity Rule.
Identifies whether sequential steps can be run concurrently.
Edge Case 3: When no parallelizable tasks exist, system strictly does NOT recommend parallelisation.
"""
from typing import Optional, Dict, Any
from backend.app.config import THRESHOLDS

class ParallelRule:
    def __init__(self, min_tasks: int = THRESHOLDS.MIN_PARALLEL_TASKS, min_savings: float = THRESHOLDS.MIN_PARALLEL_SAVINGS_SECONDS):
        self.min_tasks = min_tasks
        self.min_savings = min_savings

    def evaluate(self, build_record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        parallelizable_tasks = int(build_record.get("parallelizable_tasks") or 0)
        task_duration = float(build_record.get("task_duration_seconds") or 0.0)

        # Edge Case 3: No parallelisation opportunity
        if parallelizable_tasks < self.min_tasks:
            # System should NOT recommend parallelisation
            return None

        # Sequential duration of the independent tasks (modelled realistically)
        sequential_duration = round(task_duration * parallelizable_tasks, 2)
        
        # Parallel duration (approx longest task + small orchestration overhead 10%)
        potential_parallel_duration = round(task_duration * 1.15, 2)
        
        estimated_saving = round(max(0.0, sequential_duration - potential_parallel_duration), 2)

        if estimated_saving >= self.min_savings:
            return {
                "detected": True,
                "problem": "PARALLELISATION_OPPORTUNITY",
                "severity": "MEDIUM",
                "observed_value": f"{parallelizable_tasks} independent tasks executing sequentially",
                "threshold": f"{self.min_tasks} independent parallelizable tasks",
                "evidence": {
                    "parallelizable_tasks_count": parallelizable_tasks,
                    "sequential_duration_seconds": sequential_duration,
                    "potential_parallel_duration_seconds": potential_parallel_duration,
                    "estimated_saving_seconds": estimated_saving
                },
                "recommendation": "Potential parallelisation opportunity. Configuring these independent tasks to run concurrently could reduce overall pipeline wall-clock time.",
                "estimated_impact": f"Potential parallel duration: {potential_parallel_duration}s vs Sequential: {sequential_duration}s. Estimated saving: ~{estimated_saving}s (Not guaranteed; subject to runner concurrency limits)."
            }

        return None
