#!/bin/bash

echo "🚀 安裝 Nginx 代理伺服器..."

# 檢查是否已安裝
if command -v nginx &> /dev/null; then
    echo "✅ Nginx 已安裝"
else
    echo "📦 安裝 Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

echo "🔧 配置 Nginx..."
# 複製配置文件
sudo cp nginx.conf /etc/nginx/sites-available/restaurant-system
sudo ln -sf /etc/nginx/sites-available/restaurant-system /etc/nginx/sites-enabled/

# 測試配置
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "🚀 啟動 Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx 代理伺服器已啟動"
    echo "🌐 訪問地址："
    echo "  客戶端前端: http://192.168.1.100/frontend/"
    echo "  管理後台: http://192.168.1.100/admin/"
    echo "  API: http://192.168.1.100/api/"
else
    echo "❌ Nginx 配置錯誤"
    exit 1
fi 