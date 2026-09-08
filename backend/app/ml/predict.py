"""
ML Inference Service.
Loads the trained model bundle and performs live predictions for CI builds.
"""
from typing import Dict, Any, List
import joblib
import numpy as np
import pandas as pd
from backend.app.config import MODEL_FILE_PATH, ML_FEATURES

class MLPredictor:
    def __init__(self):
        self.bundle = None
        self.model = None
        self.scaler = None
        self.features = ML_FEATURES
        self.model_name = "Random Forest"
        self._load_model()

    def _load_model(self):
        if not MODEL_FILE_PATH.exists():
            try:
                from backend.app.ml.train import train_and_evaluate
                train_and_evaluate()
            except Exception as exc:
                print(f"[MLPredictor] Warning: Auto-training failed: {exc}")

        if MODEL_FILE_PATH.exists():
            self.bundle = joblib.load(MODEL_FILE_PATH)
            self.model = self.bundle["model"]
            self.scaler = self.bundle["scaler"]
            self.features = self.bundle.get("features", ML_FEATURES)
            self.model_name = self.bundle.get("model_name", "Random Forest")

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("ML model has not been trained or saved yet.")

        # Extract features in ordered list
        values = []
        for feat in self.features:
            val = input_data.get(feat, 0.0)
            if val is None or (isinstance(val, float) and np.isnan(val)):
                val = 0.0
            values.append(float(val))

        X_df = pd.DataFrame([values], columns=self.features)
        X_scaled = self.scaler.transform(X_df)

        prediction = int(self.model.predict(X_scaled)[0])
        probabilities = self.model.predict_proba(X_scaled)[0]
        bottleneck_prob = float(probabilities[1])

        # Top driving factors
        contributions = []
        if hasattr(self.model, "feature_importances_"):
            for feat, val, imp in zip(self.features, values, self.model.feature_importances_):
                contributions.append({
                    "feature": feat,
                    "value": val,
                    "importance": round(float(imp), 4)
                })
            contributions = sorted(contributions, key=lambda x: x["importance"], reverse=True)

        return {
            "prediction": prediction,
            "prediction_label": "BOTTLENECK" if prediction == 1 else "NORMAL",
            "bottleneck_probability": round(bottleneck_prob, 4),
            "probability_percent": round(bottleneck_prob * 100, 1),
            "model_used": self.model_name,
            "feature_contributions": contributions[:4]
        }
