@echo off
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" -m venv .venv
  if errorlevel 1 (
    echo Failed to create venv. Install Python 3.12+ and try again.
    exit /b 1
  )
  .venv\Scripts\python.exe -m pip install -r requirements.txt
)

echo Starting SmartQueue ML service on http://localhost:8001
.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8001
