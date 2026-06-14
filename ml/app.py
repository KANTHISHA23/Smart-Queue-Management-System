"""
FastAPI inference service for wait-time prediction.
"""
import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"

app = FastAPI(title="SmartQueue ML Wait Predictor", version="1.0.0")

model = None
feature_config: dict[str, Any] = {}
model_metadata: dict[str, Any] = {}


class PredictRequest(BaseModel):
    people_ahead: int = Field(ge=0)
    position: int = Field(ge=1)
    priority_level: str = "normal"
    queue_length: int = Field(ge=0)
    avg_service_time_last_20: float = Field(gt=0)
    queue_avg_service_time: float = Field(gt=0)
    hour_of_day: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    location_type: str = "hospital"
    max_capacity: int = Field(ge=1)


class PredictResponse(BaseModel):
    estimated_wait_minutes: int
    model: str
    confidence_note: str


def load_artifacts():
    global model, feature_config, model_metadata
    model_path = MODELS_DIR / "wait_time_rf.joblib"
    config_path = MODELS_DIR / "feature_config.json"
    metadata_path = MODELS_DIR / "model_metadata.json"

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}. Run train_wait_model.py first.")

    model = joblib.load(model_path)
    feature_config = json.loads(config_path.read_text(encoding="utf-8")) if config_path.exists() else {}
    model_metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}


@app.on_event("startup")
def startup():
    load_artifacts()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "version": model_metadata.get("version"),
        "trained_at": model_metadata.get("trained_at"),
    }


@app.get("/metadata")
def metadata():
    if not model_metadata:
        raise HTTPException(status_code=404, detail="Model metadata not available.")
    return model_metadata


@app.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    numeric = feature_config.get("numeric_features", [])
    categorical = feature_config.get("categorical_features", [])

    row = {**body.model_dump()}
    df = pd.DataFrame([{col: row[col] for col in numeric + categorical if col in row}])

    minutes = int(max(0, round(float(model.predict(df)[0]))))
    return PredictResponse(
        estimated_wait_minutes=minutes,
        model="random_forest",
        confidence_note="based on historical queue patterns",
    )
