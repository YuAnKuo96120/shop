@echo off
echo 🚀 安裝 Nginx 代理伺服器...

REM 檢查是否已安裝
nginx -v >nul 2>&1
if not errorlevel 1 (
    echo ✅ Nginx 已安裝
    goto :start_nginx
)

echo 📦 下載 Nginx...
REM 下載 Nginx (您需要手動下載或使用 chocolatey)
echo 請從 https://nginx.org/en/download.html 下載 Nginx
echo 或使用 chocolatey: choco install nginx

:start_nginx
echo 🔧 配置 Nginx...
REM 複製配置文件
copy nginx.conf C:\nginx\conf\nginx.conf

echo 🚀 啟動 Nginx...
cd C:\nginx
start nginx.exe

echo ✅ Nginx 代理伺服器已啟動
echo 🌐 訪問地址：
echo   客戶端前端: http://192.168.1.100/frontend/
echo   管理後台: http://192.168.1.100/admin/
echo   API: http://192.168.1.100/api/

pause 