"""
Evaluate baseline vs Random Forest and generate comparison charts.
"""
import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "training_data.csv"
MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

NUMERIC_FEATURES = [
    "people_ahead",
    "position",
    "queue_length",
    "avg_service_time_last_20",
    "queue_avg_service_time",
    "hour_of_day",
    "day_of_week",
    "max_capacity",
]
CATEGORICAL_FEATURES = ["priority_level", "location_type"]
TARGET = "actual_wait_minutes"


def baseline_predict(df: pd.DataFrame) -> np.ndarray:
    return np.maximum(
        0,
        np.round(df["people_ahead"].fillna(0) * df["avg_service_time_last_20"].fillna(5)),
    )


def compute_metrics(y_true, y_pred):
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    within_5 = float(np.mean(np.abs(y_true - y_pred) <= 5) * 100)
    r2 = float(r2_score(y_true, y_pred)) if len(y_true) > 1 else 0.0
    return {"mae": mae, "rmse": rmse, "within_5_pct": within_5, "r2": r2}


def main():
    if not DATA_PATH.exists():
        raise SystemExit(f"Missing {DATA_PATH}. Run export_training_data.py first.")

    model_path = MODELS_DIR / "wait_time_rf.joblib"
    if not model_path.exists():
        raise SystemExit(f"Missing {model_path}. Run train_wait_model.py first.")

    df = pd.read_csv(DATA_PATH).dropna(subset=[TARGET])
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna("unknown").astype(str)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET].astype(float)

    pipeline = joblib.load(model_path)
    baseline_preds = baseline_predict(X)
    rf_preds = np.maximum(0, np.round(pipeline.predict(X)))

    baseline_metrics = compute_metrics(y, baseline_preds)
    rf_metrics = compute_metrics(y, rf_preds)

    comparison = pd.DataFrame(
        [
            {"model": "baseline_heuristic", **baseline_metrics},
            {"model": "random_forest", **rf_metrics},
        ]
    )
    comparison_path = REPORTS_DIR / "comparison_table.csv"
    comparison.to_csv(comparison_path, index=False)

    # Feature importance plot
    metadata_path = MODELS_DIR / "model_metadata.json"
    if metadata_path.exists():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        importance = metadata.get("feature_importance", {})
        if importance:
            top = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:12]
            names, scores = zip(*top)
            plt.figure(figsize=(10, 6))
            plt.barh(list(reversed(names)), list(reversed(scores)), color="#4F46E5")
            plt.xlabel("Importance")
            plt.title("Random Forest Feature Importance")
            plt.tight_layout()
            plt.savefig(REPORTS_DIR / "feature_importance.png", dpi=150)
            plt.close()

    # Predicted vs actual scatter
    plt.figure(figsize=(7, 7))
    plt.scatter(y, baseline_preds, alpha=0.5, label="Baseline", color="#94A3B8")
    plt.scatter(y, rf_preds, alpha=0.5, label="Random Forest", color="#4F46E5")
    max_val = max(y.max(), baseline_preds.max(), rf_preds.max())
    plt.plot([0, max_val], [0, max_val], "k--", linewidth=1, label="Perfect")
    plt.xlabel("Actual wait (minutes)")
    plt.ylabel("Predicted wait (minutes)")
    plt.title("Predicted vs Actual Wait Time")
    plt.legend()
    plt.tight_layout()
    plt.savefig(REPORTS_DIR / "predicted_vs_actual.png", dpi=150)
    plt.close()

    print("=== Evaluation Report ===")
    print(comparison.to_string(index=False))
    print(f"\nSaved: {comparison_path}")
    print(f"Saved: {REPORTS_DIR / 'feature_importance.png'}")
    print(f"Saved: {REPORTS_DIR / 'predicted_vs_actual.png'}")


if __name__ == "__main__":
    main()
