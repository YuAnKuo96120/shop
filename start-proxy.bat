@echo off
echo 🚀 啟動代理伺服器...

REM 檢查是否使用 Nginx 或開發代理
if "%1"=="nginx" (
    echo 📦 使用 Nginx 代理...
    call install-nginx-windows.bat
) else (
    echo 📦 使用開發代理...
    
    REM 安裝依賴
    npm install express http-proxy-middleware
    
    REM 建置前端
    cd frontend
    call npm run build
    cd ..
    
    cd admin-frontend
    call npm run build
    cd ..
    
    REM 啟動代理
    node start-dev-proxy.js
)

pause 