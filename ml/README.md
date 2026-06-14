# SmartQueue ML Wait-Time Prediction

Random Forest regressor layered on top of the existing rule-based heuristic.

## Problem

Predict **actual wait in minutes** at token booking time from live queue state.

**Label:** `(called_at - booked_at)` in minutes for completed tokens.

## Baseline (existing heuristic)

```
estimated_wait = people_ahead × avg_service_time_last_20
```

## Why Random Forest

- Handles non-linear patterns (rush hour, priority mix, location type)
- Robust with mixed numeric + categorical features
- Feature importance for panel/demo explanation

## Features

| Feature | Source |
|---------|--------|
| people_ahead | Priority-aware count ahead in queue |
| position | Token position |
| priority_level | normal / priority / emergency |
| queue_length | Waiting tokens in queue |
| avg_service_time_last_20 | Rolling avg from last 20 completions |
| queue_avg_service_time | Queue config default |
| hour_of_day, day_of_week | From booked_at |
| location_type | hospital / clinic / bank / government |
| max_capacity | Queue capacity |

## Architecture

```
Node.js backend (queueMetrics.service.js)
    → build features (waitPredictionFeatures.service.js)
    → POST /predict → FastAPI (ml/app.py)
    → wait_time_rf.joblib
    ↳ fallback: heuristic if ML unavailable
```

## Setup

```bash
# 1. Seed training data
cd backend && npm run migrate && npm run seed

# 2. Python environment
cd ../ml
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# 3. Train
python export_training_data.py
python train_wait_model.py
python evaluate_model.py

# 4. Run inference service
uvicorn app:app --host 0.0.0.0 --port 8001
```

## Backend env

```env
ML_SERVICE_URL=http://localhost:8001
ML_PREDICTION_ENABLED=true
ML_TIMEOUT_MS=2000
```

## Retrain

```bash
# Windows
ml\retrain.bat

# Linux/macOS
./ml/retrain.sh
```

## Evaluation outputs

- `ml/reports/comparison_table.csv`
- `ml/reports/feature_importance.png`
- `ml/reports/predicted_vs_actual.png`
- `ml/models/model_metadata.json`

## Fallback strategy

**Primary:** Random Forest when ML service responds within timeout.

**Fallback:** `people_ahead × rolling_avg_service_time` — always works if ML is down.

Queue ordering (priority, call-next) is unchanged; only wait **estimates** use ML.
