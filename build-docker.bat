@echo off
echo 正在建置餐廳管理系統 Docker 映像...

REM 檢查 Docker 是否運行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤：Docker 未運行，請先啟動 Docker Desktop
    pause
    exit /b 1
)

REM 建置映像
echo 正在建置 Docker 映像...
docker build -t restaurant-system .

if %errorlevel% equ 0 (
    echo.
    echo 建置成功！可以使用以下命令運行：
    echo docker run -p 80:80 -p 3000:3000 restaurant-system
    echo.
    echo 或者使用 Docker Compose：
    echo docker-compose up -d
) else (
    echo.
    echo 建置失敗！請檢查錯誤訊息
)

pause 