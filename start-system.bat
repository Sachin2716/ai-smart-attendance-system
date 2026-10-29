@echo off
TITLE AI Smart Attendance System - Master Launcher
echo ======================================================================
echo    AI-BASED SMART ATTENDANCE MANAGEMENT SYSTEM (FULL-STACK)
echo ======================================================================
echo.

echo [1/3] Checking Python Backend environment...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo Installing backend requirements...
pip install -r requirements.txt -q

echo Initializing database with seed accounts...
python -m app.db.init_db

echo Starting FastAPI AI Backend on http://127.0.0.1:8000 ...
start "FastAPI AI Backend" cmd /k "venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

cd ..

echo.
echo [2/3] Checking Frontend Dependencies...
if not exist "node_modules" (
    echo Installing node modules...
    call npm install
)

echo.
echo [3/3] Starting Next.js Frontend on http://localhost:3000 ...
start "Next.js Frontend" cmd /k "npm run dev"

echo.
echo ======================================================================
echo System successfully launched!
echo - Frontend: http://localhost:3000
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo.
echo Development Credentials:
echo - Admin:   admin@caias.edu.in   / admin123
echo - Faculty: faculty@caias.edu.in / faculty123
echo - Student: aarav.sharma@caias.edu.in / student123 (USN: 24BCA001)
echo ======================================================================
pause
