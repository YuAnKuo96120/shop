#!/bin/bash

# Railway 優化啟動腳本
set -e

echo "🚂 正在啟動 Railway 服務..."

# 檢查環境變數
if [ -z "$PORT" ]; then
    echo "⚠️  警告：PORT 環境變數未設定，使用預設端口 3000"
    export PORT=3000
fi

# 設定 Railway 特定環境變數
export NODE_ENV=${NODE_ENV:-production}
export RAILWAY_ENVIRONMENT=${RAILWAY_ENVIRONMENT:-production}

echo "📡 服務將在端口 $PORT 上運行"
echo "🌍 環境：$RAILWAY_ENVIRONMENT"
echo "⚙️  Node.js 環境：$NODE_ENV"

# 創建必要的目錄
mkdir -p /var/log/nginx /var/cache/nginx /tmp/.npm

# 設定 nginx 配置中的端口
sed -i "s/\$PORT/$PORT/g" /etc/nginx/nginx.conf

# 啟動 nginx
echo "🌐 啟動 nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# 等待 nginx 啟動
sleep 2

# 檢查 nginx 是否啟動成功
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "❌ nginx 啟動失敗"
    exit 1
fi

echo "✅ nginx 啟動成功 (PID: $NGINX_PID)"

# 啟動後端服務
echo "⚙️  啟動後端服務..."
cd /app/backend

# 檢查資料庫連接
if [ -f "restaurant.db" ]; then
    echo "📊 資料庫檔案存在"
else
    echo "⚠️  資料庫檔案不存在，將創建新的資料庫"
fi

# 啟動 Node.js 服務
npm start &
NODE_PID=$!

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 5

# 檢查服務狀態
echo "🔍 檢查服務狀態..."

# 檢查 nginx
if kill -0 $NGINX_PID 2>/dev/null; then
    echo "✅ nginx 運行正常 (PID: $NGINX_PID)"
else
    echo "❌ nginx 進程不存在"
    exit 1
fi

# 檢查 Node.js
if kill -0 $NODE_PID 2>/dev/null; then
    echo "✅ 後端服務運行正常 (PID: $NODE_PID)"
else
    echo "❌ 後端服務進程不存在"
    exit 1
fi

# 健康檢查
echo "🏥 執行健康檢查..."
if wget --no-verbose --tries=1 --spider "http://localhost:$PORT/health" 2>/dev/null; then
    echo "✅ 健康檢查通過"
else
    echo "⚠️  健康檢查失敗，但服務仍在運行"
fi

echo ""
echo "🎉 所有服務已啟動完成！"
echo "🌐 前端：http://localhost:$PORT"
echo "🔧 管理後台：http://localhost:$PORT/admin"
echo "📡 API：http://localhost:$PORT/api"
echo "🏥 健康檢查：http://localhost:$PORT/health"
echo ""

# 監控進程
while true; do
    # 檢查 nginx 是否還在運行
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ nginx 進程已停止，重啟中..."
        nginx -g "daemon off;" &
        NGINX_PID=$!
        sleep 2
    fi
    
    # 檢查 Node.js 是否還在運行
    if ! kill -0 $NODE_PID 2>/dev/null; then
        echo "❌ 後端服務進程已停止，重啟中..."
        cd /app/backend
        npm start &
        NODE_PID=$!
        sleep 5
    fi
    
    # 每 30 秒檢查一次
    sleep 30
done 