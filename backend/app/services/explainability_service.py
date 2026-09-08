"""
Explainability Service.
Translates technical rule detection signals into clear, non-specialist explanations
answering four mandatory questions:
1. What happened?
2. Why does it matter?
3. What should be done?
4. What evidence supports it?
"""
from typing import Dict, Any

class ExplainabilityService:
    @staticmethod
    def generate_explanation(problem: str, severity: str, evidence: Dict[str, Any], observed_value: str, threshold: str) -> Dict[str, str]:
        if problem == "QUEUE_BOTTLENECK":
            what_happened = f"The build spent {observed_value} waiting in the CI queue before any agent began executing tasks."
            why_it_matters = "Long queue times inflate end-to-end feedback cycles, causing developer idle time and blocking PR merges."
            what_to_do = "Consider autoscaling CI agent pools during peak commit windows or distributing jobs across underutilized runner queues."
            evidence_summary = f"Observed queue time: {observed_value} | Configured threshold: {threshold}"

        elif problem == "LOW_CACHE_EFFICIENCY":
            misses = evidence.get("cache_misses", "multiple")
            what_happened = f"Cache hit rate dropped to {observed_value}. CI repeatedly fetched or recompiled {misses} items from scratch."
            why_it_matters = "Uncached steps re-download external dependencies and rebuild unchanged code, wasting network bandwidth and runner cycles."
            what_to_do = "Audit cache keys for volatile file paths (e.g. lockfile hashes), ensure cache layers are restored before dependencies install, and enable sccache/Docker layer caching."
            evidence_summary = f"Cache hit rate: {observed_value} (threshold: {threshold}) with {evidence.get('cache_hits', 0)} hits and {evidence.get('cache_misses', 0)} misses."

        elif problem == "SLOW_TASK":
            task_name = evidence.get("task_name", "Step")
            diff = evidence.get("difference_from_normal_seconds", 0)
            what_happened = f"Task '{task_name}' ran for {observed_value}, exceeding the 90th percentile normal runtime by {diff}s."
            why_it_matters = "A single disproportionately slow step acts as the critical path bottle-neck, pacing the entire pipeline duration."
            what_to_do = "Profile this task for unoptimized test suites, slow integration calls, or redundant compilation flags. Split large tests into parallel test slices."
            evidence_summary = f"Task duration: {observed_value} vs cohort median: {evidence.get('median_duration_seconds')}s and 90th percentile threshold: {threshold}."

        elif problem == "AGENT_UTILISATION":
            what_happened = f"CI runner agent utilization reached {observed_value}, indicating near-total resource exhaustion."
            why_it_matters = "When agents run above 90% capacity, CPU throttling and memory paging slow down all concurrent tasks and delay new jobs."
            what_to_do = "Provision additional runner capacity, enforce task memory/CPU requests, or balance scheduled batch pipelines away from peak daytime hours."
            evidence_summary = f"Observed utilization: {observed_value} exceeding saturation limit of {threshold}."

        elif problem == "PARALLELISATION_OPPORTUNITY":
            tasks_count = evidence.get("parallelizable_tasks_count", 2)
            est_save = evidence.get("estimated_saving_seconds", 0)
            what_happened = f"{tasks_count} tasks are currently executed sequentially despite being independent of each other."
            why_it_matters = "Sequential execution unnecessarily serializes work that could be completed simultaneously on multiple runner threads."
            what_to_do = "Configure pipeline matrix or DAG execution so independent tasks run concurrently. (Potential parallelisation opportunity; not guaranteed)."
            evidence_summary = f"{tasks_count} parallelizable tasks with sequential time {evidence.get('sequential_duration_seconds')}s vs parallel ~{evidence.get('potential_parallel_duration_seconds')}s, saving ~{est_save}s."

        elif problem == "CACHE_DATA_MISSING":
            what_happened = "Cache telemetry was not reported for this build or step."
            why_it_matters = "Without cache telemetry, the system cannot detect cache eviction or download overhead."
            what_to_do = "Enable CI cache reporting plugins or verify the build runner emits cache hit/miss metrics."
            evidence_summary = "Cache hit rate and hits/misses telemetry were null or unrecorded."

        else:
            what_happened = f"Performance anomaly detected: {problem} with observed value {observed_value}."
            why_it_matters = "Anomalies increase build uncertainty and reduce developer productivity."
            what_to_do = "Inspect pipeline telemetry and runner resource health."
            evidence_summary = f"Observed value: {observed_value} (threshold: {threshold})"

        return {
            "what_happened": what_happened,
            "why_it_matters": why_it_matters,
            "what_to_do": what_to_do,
            "evidence_supports": evidence_summary
        }
