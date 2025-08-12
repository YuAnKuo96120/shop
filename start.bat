@echo off
echo Starting Restaurant Management System...
echo.

REM 設置環境變量來抑制棄用警告
set NODE_OPTIONS=--no-deprecation
set GENERATE_SOURCEMAP=false

echo Starting Backend...
start "Backend" cmd /k "cd backend && npm start"

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo Starting Admin Frontend...
start "Admin Frontend" cmd /k "cd admin-frontend && npm start"

echo.
echo All services are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Admin Frontend: http://localhost:3002
echo.
pause 