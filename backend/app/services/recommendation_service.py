"""
Recommendation Service.
Generates structured recommendations with evidence, impact estimations, and explainability.
Guarantees that all HIGH and CRITICAL priority recommendations contain rich evidence.
"""
from typing import List, Dict, Any, Optional
import uuid
import pandas as pd
from backend.app.rules.detector import BottleneckDetector
from backend.app.services.explainability_service import ExplainabilityService

class RecommendationService:
    def __init__(self, detector: Optional[BottleneckDetector] = None):
        self.detector = detector or BottleneckDetector()

    def generate_recommendations_for_record(self, record: Dict[str, Any]) -> List[Dict[str, Any]]:
        build_id = record.get("build_id", "BUILD-UNKNOWN")
        findings = self.detector.analyze_record(record)
        recommendations = []

        for finding in findings:
            problem = finding["problem"]
            severity = finding.get("severity", "MEDIUM")
            observed_value = finding.get("observed_value", "N/A")
            threshold = finding.get("threshold", "N/A")
            evidence = finding.get("evidence", {})
            rec_text = finding.get("recommendation", "")
            estimated_impact = finding.get("estimated_impact", "")

            # If HIGH or CRITICAL, enforce non-empty evidence
            if severity in ["HIGH", "CRITICAL"] and not evidence:
                evidence = {
                    "observed_value": observed_value,
                    "threshold": threshold,
                    "build_id": build_id
                }

            explanation = ExplainabilityService.generate_explanation(
                problem=problem,
                severity=severity,
                evidence=evidence,
                observed_value=observed_value,
                threshold=threshold
            )

            rec_id = f"REC-{uuid.uuid4().hex[:8].upper()}"

            recommendations.append({
                "recommendation_id": rec_id,
                "build_id": build_id,
                "problem": problem,
                "severity": severity,
                "observed_value": observed_value,
                "threshold": threshold,
                "recommendation": rec_text,
                "evidence": evidence,
                "estimated_impact": estimated_impact,
                "explanation": explanation
            })

        return recommendations

    def generate_recommendations_for_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        all_recs = []
        for _, row in df.iterrows():
            record = row.to_dict()
            recs = self.generate_recommendations_for_record(record)
            all_recs.extend(recs)
        return all_recs
