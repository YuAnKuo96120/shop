#!/bin/bash

echo "正在建置餐廳管理系統 Docker 映像..."

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo "錯誤：Docker 未運行，請先啟動 Docker 服務"
    exit 1
fi

# 建置映像
echo "正在建置 Docker 映像..."
docker build -t restaurant-system .

if [ $? -eq 0 ]; then
    echo ""
    echo "建置成功！可以使用以下命令運行："
    echo "docker run -p 80:80 -p 3000:3000 restaurant-system"
    echo ""
    echo "或者使用 Docker Compose："
    echo "docker-compose up -d"
else
    echo ""
    echo "建置失敗！請檢查錯誤訊息"
    exit 1
fi 