"""
Data Cleaning and Preprocessing Module for CI Build Logs.
Cleans raw CI logs:
- Deduplication
- Range validation
- Negative duration rectification / filtering
- Missing queue time imputation
- Missing cache data handling & validation
- Produces a detailed cleaning audit report
"""
import logging
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from pathlib import Path
from backend.app.config import RAW_DATA_PATH, PROCESSED_DATA_PATH

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self, raw_path: Path = RAW_DATA_PATH, processed_path: Path = PROCESSED_DATA_PATH):
        self.raw_path = raw_path
        self.processed_path = processed_path
        self.audit_report: Dict[str, Any] = {}

    def clean(self, df: pd.DataFrame = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        if df is None:
            logger.info(f"Loading raw dataset from {self.raw_path}...")
            df = pd.read_csv(self.raw_path)
            
        initial_rows = len(df)
        
        # 1. Remove duplicates
        initial_dup_count = int(df.duplicated().sum())
        df = df.drop_duplicates().reset_index(drop=True)
        rows_after_dedup = len(df)
        logger.info(f"Removed {initial_dup_count} duplicate rows.")

        # 2. Detect & Rectify invalid negative durations
        negative_task_durations = int((df["task_duration_seconds"] < 0).sum())
        negative_queue_times = int((df["queue_time_seconds"] < 0).sum())
        negative_build_durations = int((df["build_duration_seconds"] < 0).sum())
        
        # We replace negative values with positive absolute value or median if available
        pos_durations = df[df["task_duration_seconds"] > 0]["task_duration_seconds"]
        fallback_task_dur = float(pos_durations.median()) if len(pos_durations) > 0 else 60.0
        
        # Replace negative values with their absolute value if non-zero, else fallback
        df.loc[df["task_duration_seconds"] < 0, "task_duration_seconds"] = df.loc[df["task_duration_seconds"] < 0, "task_duration_seconds"].apply(
            lambda x: abs(x) if abs(x) > 0 else fallback_task_dur
        )
        df.loc[df["queue_time_seconds"] < 0, "queue_time_seconds"] = df.loc[df["queue_time_seconds"] < 0, "queue_time_seconds"].apply(
            lambda x: abs(x)
        )
        df.loc[df["build_duration_seconds"] < 0, "build_duration_seconds"] = df.loc[df["build_duration_seconds"] < 0, "build_duration_seconds"].apply(
            lambda x: abs(x) if abs(x) > 0 else fallback_task_dur * 2
        )
        
        # 3. Handle missing queue times
        missing_queue_times = int(df["queue_time_seconds"].isna().sum())
        median_queue = float(df["queue_time_seconds"].dropna().median())
        df["queue_time_seconds"] = df["queue_time_seconds"].fillna(median_queue)
        
        # 4. Handle missing cache information
        # In real CI, some jobs do not configure caching, or cache reporting fails.
        # We track how many had missing cache data.
        missing_cache = int(df["cache_hit_rate"].isna().sum())
        # For ML models, we fill missing cache_hit_rate with median or -1 to denote missing if needed,
        # but for consistent feature pipeline we fill with 0.5 (neutral) or median,
        # and we preserve cache_hits / cache_misses
        df["cache_hits"] = df["cache_hits"].fillna(0).astype(int)
        df["cache_misses"] = df["cache_misses"].fillna(0).astype(int)
        # Note: If cache_hit_rate was NaN, we keep it or fill with median for ML
        median_cache_rate = float(df["cache_hit_rate"].dropna().median())
        df["cache_hit_rate"] = df["cache_hit_rate"].fillna(median_cache_rate)
        
        # 5. Validate numerical ranges
        # cache_hit_rate must be between 0.0 and 1.0
        out_of_bounds_cache = int(((df["cache_hit_rate"] < 0.0) | (df["cache_hit_rate"] > 1.0)).sum())
        df["cache_hit_rate"] = df["cache_hit_rate"].clip(lower=0.0, upper=1.0)
        
        # agent_utilisation_percent must be between 0.0 and 1.0
        out_of_bounds_agent = int(((df["agent_utilisation_percent"] < 0.0) | (df["agent_utilisation_percent"] > 1.0)).sum())
        df["agent_utilisation_percent"] = df["agent_utilisation_percent"].clip(lower=0.0, upper=1.0)
        
        # Non-negative counts
        df["failed_tasks"] = df["failed_tasks"].fillna(0).clip(lower=0).astype(int)
        df["parallelizable_tasks"] = df["parallelizable_tasks"].fillna(0).clip(lower=0).astype(int)
        df["number_of_tasks"] = df["number_of_tasks"].fillna(1).clip(lower=1).astype(int)
        
        # Round numerical floats
        df["task_duration_seconds"] = df["task_duration_seconds"].round(2)
        df["queue_time_seconds"] = df["queue_time_seconds"].round(2)
        df["build_duration_seconds"] = df["build_duration_seconds"].round(2)
        df["agent_utilisation_percent"] = df["agent_utilisation_percent"].round(4)
        df["cache_hit_rate"] = df["cache_hit_rate"].round(4)

        final_rows = len(df)
        
        self.audit_report = {
            "initial_rows": initial_rows,
            "final_rows": final_rows,
            "duplicates_removed": initial_dup_count,
            "negative_task_durations_rectified": negative_task_durations,
            "negative_queue_times_rectified": negative_queue_times,
            "negative_build_durations_rectified": negative_build_durations,
            "missing_queue_times_imputed": missing_queue_times,
            "missing_cache_records_handled": missing_cache,
            "out_of_bounds_cache_clipped": out_of_bounds_cache,
            "out_of_bounds_agent_clipped": out_of_bounds_agent,
            "status": "CLEAN_SUCCESS"
        }
        
        logger.info(f"Cleaning complete. Audit Report: {self.audit_report}")
        return df, self.audit_report

    def clean_and_save(self) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        df, report = self.clean()
        self.processed_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(self.processed_path, index=False)
        logger.info(f"Cleaned dataset saved to {self.processed_path} ({len(df)} rows)")
        return df, report

if __name__ == "__main__":
    cleaner = DataCleaner()
    cleaner.clean_and_save()
