"""
Machine Learning Training, Model Selection, and Evaluation Pipeline.
Compares Logistic Regression vs Random Forest Classifier on cleaned CI dataset.
Computes comprehensive metrics: Accuracy, Precision, Recall, F1, Confusion Matrix,
False Positive / False Negative case analysis, and Feature Importances.
Persists the winning model and metrics for FastAPI consumption.
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from backend.app.config import (
    METRICS_FILE_PATH,
    ML_FEATURES,
    MODEL_FILE_PATH,
    PROCESSED_DATA_PATH,
    TARGET_COLUMN,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class MLPipeline:
    def __init__(self, data_path: Path = PROCESSED_DATA_PATH):
        self.data_path = data_path
        self.features = ML_FEATURES
        self.target = TARGET_COLUMN
        self.scaler = StandardScaler()
        self.best_model = None
        self.best_model_name = ""
        self.metrics_summary: Dict[str, Any] = {}

    def load_and_split(self) -> Tuple[np.ndarray, np.ndarray, pd.Series, pd.Series, pd.DataFrame]:
        logger.info(f"Loading cleaned data from {self.data_path}")
        df = pd.read_csv(self.data_path)
        
        # Ensure all required features are present and non-null
        df_clean = df.dropna(subset=self.features + [self.target]).copy()
        
        X = df_clean[self.features]
        y = df_clean[self.target].astype(int)
        
        # 80/20 train-test split stratified to avoid data leakage
        X_train, X_test, y_train, y_test, indices_train, indices_test = train_test_split(
            X, y, df_clean.index, test_size=0.20, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        test_df = df_clean.loc[indices_test].copy()
        
        return X_train_scaled, X_test_scaled, y_train, y_test, test_df

    def train_and_compare(self) -> Dict[str, Any]:
        X_train_scaled, X_test_scaled, y_train, y_test, test_df = self.load_and_split()
        
        models = {
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Random Forest": RandomForestClassifier(n_estimators=120, max_depth=8, random_state=42)
        }
        
        results = {}
        for name, clf in models.items():
            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)
            y_prob = clf.predict_proba(X_test_scaled)[:, 1] if hasattr(clf, "predict_proba") else None
            
            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            cm = confusion_matrix(y_test, y_pred).tolist()  # [[TN, FP], [FN, TP]]
            
            results[name] = {
                "model": clf,
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "confusion_matrix": cm,
                "y_pred": y_pred,
                "y_prob": y_prob
            }
            logger.info(f"{name} -> Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")
            
        # Selection logic: Prioritize F1 score & Recall (missing real bottlenecks is costly in CI)
        lr_score = results["Logistic Regression"]["f1_score"]
        rf_score = results["Random Forest"]["f1_score"]
        
        if rf_score >= lr_score:
            winner_name = "Random Forest"
        else:
            winner_name = "Logistic Regression"
            
        winner = results[winner_name]
        self.best_model = winner["model"]
        self.best_model_name = winner_name
        logger.info(f"Selected winner: {winner_name} with F1-Score: {winner['f1_score']}")
        
        # Calculate feature importances
        feature_importances = {}
        if hasattr(self.best_model, "feature_importances_"):
            importances = self.best_model.feature_importances_
            for feat, imp in zip(self.features, importances):
                feature_importances[feat] = round(float(imp), 4)
        elif hasattr(self.best_model, "coef_"):
            coefs = np.abs(self.best_model.coef_[0])
            norm_coefs = coefs / np.sum(coefs)
            for feat, imp in zip(self.features, norm_coefs):
                feature_importances[feat] = round(float(imp), 4)
                
        # Sort feature importances descending
        feature_importances = dict(sorted(feature_importances.items(), key=lambda x: x[1], reverse=True))
        
        # Error Analysis: False Positives and False Negatives
        cm = winner["confusion_matrix"]
        tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
        
        y_test_arr = y_test.to_numpy()
        y_pred = winner["y_pred"]
        
        fp_mask = (y_pred == 1) & (y_test_arr == 0)
        fn_mask = (y_pred == 0) & (y_test_arr == 1)
        
        fp_examples = test_df[fp_mask].head(3)[["build_id", "task_name", "queue_time_seconds", "task_duration_seconds", "cache_hit_rate"]].to_dict(orient="records")
        fn_examples = test_df[fn_mask].head(3)[["build_id", "task_name", "queue_time_seconds", "task_duration_seconds", "cache_hit_rate"]].to_dict(orient="records")

        metrics_data = {
            "selected_model": winner_name,
            "selection_rationale": "Selected based on highest F1-Score and strong Recall. High Recall prevents costly false negatives where genuine pipeline bottlenecks stall development without being detected.",
            "metrics": {
                "accuracy": winner["accuracy"],
                "precision": winner["precision"],
                "recall": winner["recall"],
                "f1_score": winner["f1_score"]
            },
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp),
                "raw_matrix": cm
            },
            "error_analysis": {
                "false_positives_count": int(fp),
                "false_negatives_count": int(fn),
                "fp_description": "Model flagged normal build as a bottleneck (mild developer false alarm).",
                "fn_description": "Model failed to detect an actual bottleneck (costlier miss where developers suffer delays undetected).",
                "fp_examples": fp_examples,
                "fn_examples": fn_examples
            },
            "model_comparison": {
                "Logistic Regression": {
                    "accuracy": results["Logistic Regression"]["accuracy"],
                    "precision": results["Logistic Regression"]["precision"],
                    "recall": results["Logistic Regression"]["recall"],
                    "f1_score": results["Logistic Regression"]["f1_score"],
                    "confusion_matrix": results["Logistic Regression"]["confusion_matrix"]
                },
                "Random Forest": {
                    "accuracy": results["Random Forest"]["accuracy"],
                    "precision": results["Random Forest"]["precision"],
                    "recall": results["Random Forest"]["recall"],
                    "f1_score": results["Random Forest"]["f1_score"],
                    "confusion_matrix": results["Random Forest"]["confusion_matrix"]
                }
            },
            "feature_importances": feature_importances,
            "feature_names": self.features
        }
        
        self.metrics_summary = metrics_data
        return metrics_data

    def save_artifacts(self):
        MODEL_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        # Save bundle containing trained model, scaler, and features
        bundle = {
            "model": self.best_model,
            "model_name": self.best_model_name,
            "scaler": self.scaler,
            "features": self.features
        }
        joblib.dump(bundle, MODEL_FILE_PATH)
        logger.info(f"Model bundle saved to {MODEL_FILE_PATH}")
        
        with open(METRICS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(self.metrics_summary, f, indent=2)
        logger.info(f"ML metrics saved to {METRICS_FILE_PATH}")

if __name__ == "__main__":
    pipeline = MLPipeline()
    metrics = pipeline.train_and_compare()
    pipeline.save_artifacts()
    print("Training finished successfully.")
