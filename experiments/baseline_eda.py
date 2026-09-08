"""
Baseline Exploratory Data Analysis (EDA) Script for CI Insight
Intelligent CI Bottleneck Analyser for Regulated Enterprises

Analyzes the generated synthetic telemetry across organisations,
bottleneck frequency, duration percentiles, and cache statistics.
"""

from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

def run_baseline_analysis():
    builds_path = DATA_DIR / "builds.csv"
    truth_path = DATA_DIR / "ground_truth.csv"
    cache_path = DATA_DIR / "cache_events.csv"
    agent_path = DATA_DIR / "agent_utilisation.csv"

    if not builds_path.exists():
        print("[ERROR] Datasets not found. Please run backend/generate_dataset.py first.")
        return

    df_builds = pd.read_csv(builds_path)
    df_truth = pd.read_csv(truth_path)
    df_cache = pd.read_csv(cache_path)
    df_agent = pd.read_csv(agent_path)

    merged = df_builds.merge(df_truth, on="build_id")

    print("=========================================================")
    print(" CI Insight — Baseline Telemetry Summary Report")
    print("=========================================================")
    print(f"Total Builds Analyzed: {len(df_builds):,}")
    print(f"Total Organisations:   {df_builds['organisation_id'].nunique()}")
    print(f"Total Projects:        {df_builds['project_id'].nunique()}")
    print(f"Date Range:            {df_builds['start_time'].min()[:10]} to {df_builds['start_time'].max()[:10]}")
    print("---------------------------------------------------------")
    print("1. Build Duration Percentiles (seconds):")
    print(f"   P50 (Median): {df_builds['total_duration_seconds'].median():.1f}s")
    print(f"   P75:          {df_builds['total_duration_seconds'].quantile(0.75):.1f}s")
    print(f"   P90:          {df_builds['total_duration_seconds'].quantile(0.90):.1f}s")
    print(f"   P99 (Max):    {df_builds['total_duration_seconds'].quantile(0.99):.1f}s")
    print("---------------------------------------------------------")
    print("2. Queue Wait Time Percentiles (seconds):")
    print(f"   P50 (Median): {df_builds['queue_time_seconds'].median():.1f}s")
    print(f"   P90:          {df_builds['queue_time_seconds'].quantile(0.90):.1f}s")
    print(f"   Max Queue:    {df_builds['queue_time_seconds'].max():.1f}s")
    print("---------------------------------------------------------")
    print("3. Bottleneck Frequency by Archetype:")
    for b_type, count in df_truth["actual_bottleneck"].value_counts().items():
        pct = (count / len(df_truth)) * 100
        print(f"   - {b_type:<25}: {count:>4} builds ({pct:>5.1f}%)")
    print("---------------------------------------------------------")
    print("4. Cache Efficiency Overview:")
    cache_counts = df_cache["cache_status"].value_counts()
    hit_rate = (cache_counts.get("HIT", 0) / len(df_cache)) * 100
    print(f"   Total Cache Events: {len(df_cache):,}")
    print(f"   Cache Hit Rate:     {hit_rate:.1f}%")
    print("=========================================================")

if __name__ == "__main__":
    run_baseline_analysis()
