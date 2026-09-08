"""
Synthetic CI Build Dataset Generator.
Generates realistic CI build execution logs with realistic correlations,
realistic noise, and a controlled set of edge cases/dirty records for data cleaning.
"""
import random
import numpy as np
import pandas as pd
from pathlib import Path
from backend.app.config import RAW_DATA_PATH, THRESHOLDS

def generate_ci_dataset(num_records: int = 3000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    random.seed(random_seed)

    task_categories = [
        "checkout",
        "dependency_install",
        "compile",
        "unit_test",
        "integration_test",
        "security_scan",
        "lint",
        "build",
        "package"
    ]
    
    task_category_weights = [0.10, 0.12, 0.14, 0.18, 0.12, 0.08, 0.10, 0.10, 0.06]

    records = []
    
    for i in range(1, num_records + 1):
        build_num = 1000 + (i // 3)  # multiple tasks can belong to the same build
        build_id = f"BUILD-{build_num}"
        pipeline_id = f"PIPE-{random.choice(['core', 'api', 'web', 'worker', 'auth', 'ml'])}"
        
        category = random.choices(task_categories, weights=task_category_weights)[0]
        task_name = f"{category}_step_{random.randint(1, 4)}"
        
        # Base realistic distributions
        if category in ["unit_test", "integration_test"]:
            task_duration = float(np.random.gamma(shape=3.5, scale=40))  # avg ~140s, right skewed
        elif category in ["compile", "build"]:
            task_duration = float(np.random.gamma(shape=4.0, scale=35))  # avg ~140s
        elif category == "dependency_install":
            task_duration = float(np.random.gamma(shape=2.5, scale=30))  # avg ~75s
        elif category == "security_scan":
            task_duration = float(np.random.gamma(shape=3.0, scale=45))  # avg ~135s
        else:
            task_duration = float(np.random.gamma(shape=2.0, scale=15))  # avg ~30s
            
        task_duration = round(max(5.0, task_duration), 2)
        
        # Queue time (bimodal: normal wait ~30-120s, bottleneck wait >300s)
        is_queue_spike = random.random() < 0.18
        if is_queue_spike:
            queue_time = float(np.random.uniform(305.0, 720.0))
        else:
            queue_time = float(np.random.exponential(scale=65.0) + 10.0)
        queue_time = round(max(0.0, queue_time), 2)
        
        # Cache hits & misses
        # Certain tasks (like checkout/dependency_install) are cache-sensitive
        has_cache = category in ["dependency_install", "compile", "build", "unit_test", "lint"]
        if has_cache:
            is_cache_cold = random.random() < 0.22
            if is_cache_cold:
                cache_hits = random.randint(0, 20)
                cache_misses = random.randint(40, 150)
            else:
                cache_hits = random.randint(50, 200)
                cache_misses = random.randint(2, 30)
            total_cache = cache_hits + cache_misses
            cache_hit_rate = round(cache_hits / total_cache, 4) if total_cache > 0 else 0.0
        else:
            cache_hits = 0
            cache_misses = 0
            cache_hit_rate = 1.0  # not an issue for non-caching steps
            
        # Agent utilisation (0.1 to 1.0)
        is_agent_overloaded = random.random() < 0.15
        if is_agent_overloaded:
            agent_utilisation = round(float(np.random.uniform(0.91, 0.99)), 4)
        else:
            agent_utilisation = round(float(np.random.beta(a=4, b=3) * 0.85 + 0.05), 4)
            
        number_of_tasks = random.randint(4, 18)
        failed_tasks = 1 if (random.random() < 0.08) else (2 if random.random() < 0.02 else 0)
        
        # Parallelizable tasks
        if random.random() < 0.45:
            parallelizable_tasks = random.randint(2, min(6, number_of_tasks))
        else:
            parallelizable_tasks = 0
            
        # Build total duration (approx sum + queue + overhead)
        overhead = float(np.random.uniform(15, 60))
        build_duration = round(task_duration * (number_of_tasks * 0.35) + queue_time + overhead, 2)
        
        # Build status
        if failed_tasks > 0:
            build_status = "FAILED"
        elif queue_time + task_duration > 900:
            build_status = random.choice(["TIMED_OUT", "SUCCESS"])
        else:
            build_status = "SUCCESS"
            
        # Determine bottleneck labels with realistic correlations + noise
        score = 0.0
        bottleneck_types = []
        
        if queue_time > THRESHOLDS.QUEUE_TIME_THRESHOLD:
            score += 2.5
            bottleneck_types.append("QUEUE_BOTTLENECK")
            
        if has_cache and cache_hit_rate < THRESHOLDS.CACHE_HIT_RATE_THRESHOLD:
            score += 2.0
            bottleneck_types.append("LOW_CACHE_EFFICIENCY")
            
        # Slow task threshold approx 90th percentile (~250s for tests/builds)
        if task_duration > 220.0:
            score += 2.2
            bottleneck_types.append("SLOW_TASK")
            
        if agent_utilisation > THRESHOLDS.AGENT_UTILISATION_THRESHOLD:
            score += 1.8
            bottleneck_types.append("AGENT_UTILISATION")
            
        if parallelizable_tasks >= 3 and task_duration > 150.0:
            score += 1.2
            bottleneck_types.append("PARALLELISATION_OPPORTUNITY")
            
        # Add realistic noise so label is not 100% deterministic
        noise = np.random.normal(0, 0.6)
        prob = 1.0 / (1.0 + np.exp(-(score - 2.2 + noise)))
        
        is_bottleneck = 1 if prob >= 0.50 else 0
        
        if is_bottleneck:
            b_type = bottleneck_types[0] if bottleneck_types else "SLOW_TASK"
            if score >= 4.0:
                severity = "CRITICAL"
            elif score >= 2.5:
                severity = "HIGH"
            else:
                severity = "MEDIUM"
        else:
            b_type = "NONE"
            severity = "NONE" if random.random() > 0.1 else "LOW"
            
        records.append({
            "build_id": build_id,
            "pipeline_id": pipeline_id,
            "task_name": task_name,
            "task_category": category,
            "task_duration_seconds": task_duration,
            "queue_time_seconds": queue_time,
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
            "cache_hit_rate": cache_hit_rate,
            "agent_utilisation_percent": agent_utilisation,
            "number_of_tasks": number_of_tasks,
            "failed_tasks": failed_tasks,
            "parallelizable_tasks": parallelizable_tasks,
            "build_duration_seconds": build_duration,
            "build_status": build_status,
            "bottleneck_label": is_bottleneck,
            "bottleneck_type": b_type,
            "severity": severity
        })

    df = pd.DataFrame(records)
    
    # Introduce controlled data quality anomalies for preprocessing to clean:
    # 1. Duplicates (~1%)
    dup_indices = np.random.choice(df.index, size=int(num_records * 0.012), replace=False)
    df_dups = df.loc[dup_indices].copy()
    
    # 2. Missing cache info (~1.5%)
    missing_cache_idx = np.random.choice(df.index, size=int(num_records * 0.015), replace=False)
    df.loc[missing_cache_idx, "cache_hit_rate"] = np.nan
    df.loc[missing_cache_idx, "cache_hits"] = np.nan
    df.loc[missing_cache_idx, "cache_misses"] = np.nan
    
    # 3. Missing queue time (~1%)
    missing_queue_idx = np.random.choice(df.index, size=int(num_records * 0.010), replace=False)
    df.loc[missing_queue_idx, "queue_time_seconds"] = np.nan
    
    # 4. Invalid negative durations (~0.5%)
    neg_duration_idx = np.random.choice(df.index, size=int(num_records * 0.005), replace=False)
    df.loc[neg_duration_idx, "task_duration_seconds"] = -15.0
    
    # Concatenate duplicates
    df = pd.concat([df, df_dups], ignore_index=True)
    
    return df

def generate_and_save_dataset():
    RAW_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df = generate_ci_dataset(num_records=3200, random_seed=42)
    df.to_csv(RAW_DATA_PATH, index=False)
    print(f"Dataset generated successfully at {RAW_DATA_PATH} with {len(df)} rows and {len(df.columns)} columns.")
    return df

if __name__ == "__main__":
    generate_and_save_dataset()
