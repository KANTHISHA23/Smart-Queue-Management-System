@echo off
cd /d "%~dp0"
python export_training_data.py
python train_wait_model.py
python evaluate_model.py
echo Retrain complete. Restart ML service: uvicorn app:app --host 0.0.0.0 --port 8001
