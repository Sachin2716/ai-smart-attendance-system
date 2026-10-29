@echo off
TITLE AI Smart Attendance System - Automated Test Runner
echo ======================================================================
echo    RUNNING COMPREHENSIVE AUTOMATED TEST SUITE
echo ======================================================================
echo.

echo [1/2] Executing Python Pytest Suite (Face Biometrics, Attendance, RBAC, Reports)...
cd backend
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m pytest -v
) else (
    python -m pytest -v
)
cd ..

echo.
echo [2/2] Validating Next.js Production Build and TypeScript compilation...
call npm run build

echo.
echo ======================================================================
echo All tests and builds completed!
echo ======================================================================
pause
