#!/bin/bash

echo "🚂 正在啟動 Railway 服務..."

# 檢查環境變數
if [ -z "$PORT" ]; then
    echo "⚠️  警告：PORT 環境變數未設定，使用預設端口 3000"
    export PORT=3000
fi

echo "📡 服務將在端口 $PORT 上運行"

# 創建必要的目錄
mkdir -p /var/log/nginx /var/cache/nginx

# 設定 nginx 配置中的端口
sed -i "s/\$PORT/$PORT/g" /etc/nginx/nginx.conf

# 啟動 nginx
echo "🌐 啟動 nginx..."
nginx

# 啟動後端服務（固定在 3001，避免與 Nginx 的 $PORT 衝突）
echo "⚙️  啟動後端服務..."
cd /app/backend
PORT=3001 NODE_OPTIONS=--no-deprecation node index.js &

echo "🎉 所有服務已啟動完成！"
echo "🌐 前端：http://localhost:$PORT"
echo "🔧 管理後台：http://localhost:$PORT/admin"
echo "📡 API：http://localhost:$PORT/api"

# 保持腳本運行
tail -f /dev/null 