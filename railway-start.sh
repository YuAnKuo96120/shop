#!/bin/bash

# Railway 專用啟動腳本
echo "🚂 正在啟動 Railway 服務..."

# 檢查環境變數
if [ -z "$PORT" ]; then
    echo "⚠️  警告：PORT 環境變數未設定，使用預設端口 3000"
    export PORT=3000
fi

echo "📡 服務將在端口 $PORT 上運行"

# 啟動 nginx
echo "🌐 啟動 nginx..."
nginx

# 啟動後端服務
echo "⚙️  啟動後端服務..."
cd /app/backend
npm start &

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 5

# 檢查服務狀態
echo "🔍 檢查服務狀態..."
if pgrep -f "nginx" > /dev/null; then
    echo "✅ nginx 運行正常"
else
    echo "❌ nginx 啟動失敗"
fi

if pgrep -f "node" > /dev/null; then
    echo "✅ 後端服務運行正常"
else
    echo "❌ 後端服務啟動失敗"
fi

echo "🎉 所有服務已啟動完成！"
echo "🌐 前端：http://localhost:$PORT"
echo "🔧 管理後台：http://localhost:$PORT/admin"
echo "📡 API：http://localhost:$PORT/api"

# 保持腳本運行
tail -f /dev/null 