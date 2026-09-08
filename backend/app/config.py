"""
Central Configuration for CI Bottleneck Analyser.
All rule thresholds and paths are defined here to avoid hardcoding across modules.
"""
from pathlib import Path
from pydantic import BaseModel

# Base Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "ci_builds_raw.csv"
PROCESSED_DATA_PATH = DATA_DIR / "processed" / "ci_builds_cleaned.csv"
MODELS_DIR = BASE_DIR / "models"
MODEL_FILE_PATH = MODELS_DIR / "best_model.joblib"
METRICS_FILE_PATH = MODELS_DIR / "ml_metrics.json"
DATABASE_URL = f"sqlite:///{BASE_DIR / 'backend' / 'ci_analyser.db'}"

class ThresholdConfig(BaseModel):
    # Rule 1: Queue Bottleneck threshold in seconds (5 minutes)
    QUEUE_TIME_THRESHOLD: float = 300.0
    
    # Rule 2: Low Cache Efficiency threshold (50%)
    CACHE_HIT_RATE_THRESHOLD: float = 0.50
    
    # Rule 3: Slow Task duration percentile
    SLOW_TASK_PERCENTILE: float = 90.0
    
    # Rule 4: Agent Utilisation threshold (90%)
    AGENT_UTILISATION_THRESHOLD: float = 0.90
    
    # Rule 5: Parallelisation minimum tasks and minimum savings
    MIN_PARALLEL_TASKS: int = 2
    MIN_PARALLEL_SAVINGS_SECONDS: float = 30.0

# Singleton configuration instance
THRESHOLDS = ThresholdConfig()

# Feature list for ML Models
ML_FEATURES = [
    "queue_time_seconds",
    "task_duration_seconds",
    "cache_hit_rate",
    "agent_utilisation_percent",
    "number_of_tasks",
    "failed_tasks",
    "parallelizable_tasks",
    "build_duration_seconds"
]
TARGET_COLUMN = "bottleneck_label"
