"""
Train RandomForestRegressor for wait-time prediction and compare to rule-based baseline.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "data" / "training_data.csv"
MODELS_DIR = ML_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

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
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    within_5 = float(np.mean(np.abs(y_true - y_pred) <= 5) * 100)
    r2 = float(r2_score(y_true, y_pred)) if len(y_true) > 1 else 0.0
    return {"mae": mae, "rmse": rmse, "within_5_pct": within_5, "r2": r2}


def main():
    if not DATA_PATH.exists():
        raise SystemExit(f"Missing {DATA_PATH}. Run export_training_data.py first.")

    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=[TARGET])
    if len(df) < 10:
        raise SystemExit(f"Need at least 10 completed tokens, found {len(df)}.")

    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna("unknown").astype(str)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET].astype(float)

    test_size = 0.2 if len(df) >= 25 else 0.25
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    baseline_test = baseline_predict(X_test)
    baseline_metrics = compute_metrics(y_test, baseline_test)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline([("prep", preprocessor), ("model", model)])
    pipeline.fit(X_train, y_train)

    rf_test = np.maximum(0, np.round(pipeline.predict(X_test)))
    rf_metrics = compute_metrics(y_test, rf_test)

    use_ml = rf_metrics["mae"] <= baseline_metrics["mae"]
    mae_improvement = 0.0
    if baseline_metrics["mae"] > 0:
        mae_improvement = (
            (baseline_metrics["mae"] - rf_metrics["mae"]) / baseline_metrics["mae"] * 100
        )

    feature_names = NUMERIC_FEATURES + list(
        pipeline.named_steps["prep"]
        .named_transformers_["cat"]
        .get_feature_names_out(CATEGORICAL_FEATURES)
    )
    importances = pipeline.named_steps["model"].feature_importances_
    importance_map = {
        name: float(score) for name, score in zip(feature_names, importances)
    }

    joblib.dump(pipeline, MODELS_DIR / "wait_time_rf.joblib")

    feature_config = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "feature_names": feature_names,
        "target": TARGET,
    }
    (MODELS_DIR / "feature_config.json").write_text(
        json.dumps(feature_config, indent=2), encoding="utf-8"
    )

    metadata = {
        "version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_rows": len(df),
        "use_ml_in_production": use_ml,
        "baseline_metrics": baseline_metrics,
        "random_forest_metrics": rf_metrics,
        "mae_improvement_pct": round(mae_improvement, 2),
        "feature_importance": importance_map,
    }
    (MODELS_DIR / "model_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )

    print("=== Wait Time Model Training ===")
    print(f"Rows: {len(df)} | Test size: {len(y_test)}")
    print(f"Baseline MAE: {baseline_metrics['mae']:.2f} min")
    print(f"Random Forest MAE: {rf_metrics['mae']:.2f} min")
    print(f"MAE improvement: {mae_improvement:.1f}%")
    print(f"Use ML in production: {use_ml}")
    print(f"Model saved to {MODELS_DIR / 'wait_time_rf.joblib'}")


if __name__ == "__main__":
    main()
