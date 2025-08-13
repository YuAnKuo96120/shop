#!/bin/sh

echo "🚂 正在啟動 Railway 服務..."

# 檢查環境變數
if [ -z "$PORT" ]; then
    echo "⚠️  警告：PORT 環境變數未設定，使用預設端口 3000"
    export PORT=3000
fi

echo "📡 服務將在端口 $PORT 上運行"

echo "🔧 準備提供靜態檔案與 API..."

# 將建置好的前端檔案複製到 backend 的 public 內，讓 Express 直接服務
mkdir -p /app/backend/public
mkdir -p /app/backend/public/admin
cp -r /app/frontend/build/* /app/backend/public/
cp -r /app/admin-frontend/build/* /app/backend/public/admin/

# 啟動後端（使用 Railway 提供的 $PORT 作為對外端口）
echo "⚙️  啟動後端服務..."
cd /app/backend
PORT="$PORT" NODE_OPTIONS=--no-deprecation node index.js &

echo "🎉 所有服務已啟動完成！"
echo "🌐 前端：http://localhost:$PORT"
echo "🔧 管理後台：http://localhost:$PORT/admin"
echo "📡 API：http://localhost:$PORT/api"

# 保持腳本運行
tail -f /dev/null 