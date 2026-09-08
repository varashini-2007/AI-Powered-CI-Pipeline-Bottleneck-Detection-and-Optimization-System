"""
Database Initialization and Seed Script.
Creates database schema and populates Builds, Bottlenecks, and Recommendations
directly from the cleaned dataset.
"""
import json
import logging
import pandas as pd
from backend.app.config import PROCESSED_DATA_PATH
from backend.app.db.session import engine, SessionLocal
from backend.app.models.db_models import Base, Build, Bottleneck, Recommendation
from backend.app.rules.detector import BottleneckDetector
from backend.app.services.recommendation_service import RecommendationService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def init_and_seed_db(limit_records: int = 1500):
    logger.info("Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    if not PROCESSED_DATA_PATH.exists():
        logger.error(f"Cleaned dataset not found at {PROCESSED_DATA_PATH}. Please run preprocessor first.")
        return

    logger.info(f"Reading cleaned dataset from {PROCESSED_DATA_PATH}...")
    df = pd.read_csv(PROCESSED_DATA_PATH)
    if limit_records and len(df) > limit_records:
        df = df.iloc[:limit_records]

    detector = BottleneckDetector(historical_df=df)
    rec_service = RecommendationService(detector=detector)

    db = SessionLocal()
    try:
        build_objects = []
        bottleneck_objects = []
        recommendation_objects = []

        logger.info(f"Processing {len(df)} records for DB seed...")
        for _, row in df.iterrows():
            rec_dict = row.to_dict()
            
            build_obj = Build(
                build_id=str(rec_dict["build_id"]),
                pipeline_id=str(rec_dict["pipeline_id"]),
                task_name=str(rec_dict["task_name"]),
                task_category=str(rec_dict["task_category"]),
                task_duration_seconds=float(rec_dict["task_duration_seconds"]),
                queue_time_seconds=float(rec_dict["queue_time_seconds"]),
                cache_hits=int(rec_dict["cache_hits"]),
                cache_misses=int(rec_dict["cache_misses"]),
                cache_hit_rate=float(rec_dict["cache_hit_rate"]),
                agent_utilisation_percent=float(rec_dict["agent_utilisation_percent"]),
                number_of_tasks=int(rec_dict["number_of_tasks"]),
                failed_tasks=int(rec_dict["failed_tasks"]),
                parallelizable_tasks=int(rec_dict["parallelizable_tasks"]),
                build_duration_seconds=float(rec_dict["build_duration_seconds"]),
                build_status=str(rec_dict["build_status"]),
                bottleneck_label=int(rec_dict["bottleneck_label"]),
                bottleneck_type=str(rec_dict["bottleneck_type"]),
                severity=str(rec_dict["severity"])
            )
            build_objects.append(build_obj)

            # Analyze for bottlenecks and recommendations
            recs = rec_service.generate_recommendations_for_record(rec_dict)
            for r in recs:
                b_obj = Bottleneck(
                    build_id=r["build_id"],
                    problem=r["problem"],
                    severity=r["severity"],
                    observed_value=r["observed_value"],
                    threshold=r["threshold"],
                    recommendation=r["recommendation"],
                    estimated_impact=r.get("estimated_impact", "")
                )
                bottleneck_objects.append(b_obj)

                rec_obj = Recommendation(
                    recommendation_id=r["recommendation_id"],
                    build_id=r["build_id"],
                    problem=r["problem"],
                    severity=r["severity"],
                    observed_value=r["observed_value"],
                    threshold=r["threshold"],
                    recommendation=r["recommendation"],
                    evidence_json=json.dumps(r["evidence"]),
                    estimated_impact=r.get("estimated_impact", ""),
                    what_happened=r["explanation"]["what_happened"],
                    why_it_matters=r["explanation"]["why_it_matters"],
                    what_to_do=r["explanation"]["what_to_do"],
                    evidence_supports=r["explanation"]["evidence_supports"]
                )
                recommendation_objects.append(rec_obj)

        db.bulk_save_objects(build_objects)
        db.bulk_save_objects(bottleneck_objects)
        db.bulk_save_objects(recommendation_objects)
        db.commit()

        logger.info(f"Database successfully initialized and seeded:")
        logger.info(f" - {len(build_objects)} Builds inserted")
        logger.info(f" - {len(bottleneck_objects)} Bottlenecks recorded")
        logger.info(f" - {len(recommendation_objects)} Recommendations generated with evidence")

    except Exception as e:
        db.rollback()
        logger.error(f"Error during DB seed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_and_seed_db()
