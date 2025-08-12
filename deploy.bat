@echo off
setlocal enabledelayedexpansion

REM 餐廳管理系統 Windows 部署腳本
REM 使用方法: deploy.bat [production|staging]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production
set DOMAIN=192.168.1.100  # 請將 192.168.1.100 替換為您的實際 IP 地址

echo 🚀 開始部署餐廳管理系統到 %ENVIRONMENT% 環境...

REM 檢查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安裝
    pause
    exit /b 1
)

REM 檢查 npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安裝
    pause
    exit /b 1
)

echo ✅ 所有需求已滿足

REM 安裝依賴
echo 📦 安裝依賴項...

REM 安裝根目錄依賴
call npm install
if errorlevel 1 (
    echo ❌ 根目錄依賴安裝失敗
    pause
    exit /b 1
)

REM 安裝後端依賴
cd backend
call npm install
if errorlevel 1 (
    echo ❌ 後端依賴安裝失敗
    pause
    exit /b 1
)
cd ..

REM 安裝前端依賴
cd frontend
call npm install
if errorlevel 1 (
    echo ❌ 前端依賴安裝失敗
    pause
    exit /b 1
)
cd ..

REM 安裝管理前端依賴
cd admin-frontend
call npm install
if errorlevel 1 (
    echo ❌ 管理前端依賴安裝失敗
    pause
    exit /b 1
)
cd ..

echo ✅ 依賴項安裝完成

REM 建置前端
echo 🏗️ 建置前端應用...

REM 建置客戶端前端
cd frontend
call npm run build
if errorlevel 1 (
    echo ❌ 客戶端前端建置失敗
    pause
    exit /b 1
)
cd ..

REM 建置管理前端
cd admin-frontend
call npm run build
if errorlevel 1 (
    echo ❌ 管理前端建置失敗
    pause
    exit /b 1
)
cd ..

echo ✅ 前端建置完成

REM 啟動服務
echo 🚀 啟動服務...

REM 檢查 PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo 📦 安裝 PM2...
    call npm install -g pm2
)

REM 啟動後端
cd backend
call pm2 start index.js --name "restaurant-backend" --env %ENVIRONMENT%
if errorlevel 1 (
    echo ❌ 後端服務啟動失敗
    pause
    exit /b 1
)
cd ..

echo ✅ 服務啟動完成

REM 健康檢查
echo 🏥 執行健康檢查...

REM 等待服務啟動
timeout /t 5 /nobreak >nul

REM 檢查 API (使用 PowerShell)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing | Out-Null; Write-Host '✅ API 服務正常' } catch { Write-Host '❌ API 服務異常'; exit 1 }"

echo ✅ 所有服務運行正常

echo.
echo 🎉 部署完成！
echo.
echo 🌐 訪問地址：
echo   客戶端前端: http://localhost:3000
echo   管理後台: http://localhost:3002
echo   API: http://localhost:3001
echo.
echo 📊 監控命令：
echo   pm2 status
echo   pm2 logs
echo.

pause 