#!/bin/bash

# 餐廳管理系統部署腳本
# 使用方法: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
DOMAIN="192.168.1.100"  # 請將 192.168.1.100 替換為您的實際 IP 地址

echo "🚀 開始部署餐廳管理系統到 $ENVIRONMENT 環境..."

# 檢查必要工具
check_requirements() {
    echo "📋 檢查部署需求..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安裝"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安裝"
        exit 1
    fi
    
    if ! command -v nginx &> /dev/null; then
        echo "❌ Nginx 未安裝"
        exit 1
    fi
    
    echo "✅ 所有需求已滿足"
}

# 安裝依賴
install_dependencies() {
    echo "📦 安裝依賴項..."
    
    # 安裝根目錄依賴
    npm install
    
    # 安裝後端依賴
    cd backend
    npm install
    cd ..
    
    # 安裝前端依賴
    cd frontend
    npm install
    cd ..
    
    # 安裝管理前端依賴
    cd admin-frontend
    npm install
    cd ..
    
    echo "✅ 依賴項安裝完成"
}

# 建置前端
build_frontends() {
    echo "🏗️ 建置前端應用..."
    
    # 建置客戶端前端
    cd frontend
    npm run build
    cd ..
    
    # 建置管理前端
    cd admin-frontend
    npm run build
    cd ..
    
    echo "✅ 前端建置完成"
}

# 配置 Nginx
setup_nginx() {
    echo "🔧 配置 Nginx..."
    
    # 複製 Nginx 配置
    if [ "$ENVIRONMENT" = "production" ]; then
        sudo cp nginx-ssl.conf /etc/nginx/sites-available/restaurant-system
    else
        sudo cp nginx.conf /etc/nginx/sites-available/restaurant-system
    fi
    
    # 啟用站點
    sudo ln -sf /etc/nginx/sites-available/restaurant-system /etc/nginx/sites-enabled/
    
    # 測試配置
    sudo nginx -t
    
    # 重新載入 Nginx
    sudo systemctl reload nginx
    
    echo "✅ Nginx 配置完成"
}

# 啟動服務
start_services() {
    echo "🚀 啟動服務..."
    
    # 使用 PM2 管理 Node.js 進程
    if ! command -v pm2 &> /dev/null; then
        echo "📦 安裝 PM2..."
        npm install -g pm2
    fi
    
    # 啟動後端
    cd backend
    pm2 start index.js --name "restaurant-backend" --env $ENVIRONMENT
    cd ..
    
    echo "✅ 服務啟動完成"
}

# 健康檢查
health_check() {
    echo "🏥 執行健康檢查..."
    
    # 檢查 API
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ API 服務正常"
    else
        echo "❌ API 服務異常"
        exit 1
    fi
    
    # 檢查 Nginx
    if curl -f http://$DOMAIN/health > /dev/null 2>&1; then
        echo "✅ Nginx 代理正常"
    else
        echo "❌ Nginx 代理異常"
        exit 1
    fi
    
    echo "✅ 所有服務運行正常"
}

# 主部署流程
main() {
    echo "🎯 開始部署流程..."
    
    check_requirements
    install_dependencies
    build_frontends
    setup_nginx
    start_services
    health_check
    
    echo "🎉 部署完成！"
    echo ""
    echo "🌐 訪問地址："
    echo "  客戶端前端: http://$DOMAIN/frontend/"
    echo "  管理後台: http://$DOMAIN/admin/"
    echo "  API: http://$DOMAIN/api/"
    echo ""
    echo "📊 監控命令："
    echo "  pm2 status"
    echo "  pm2 logs"
    echo "  sudo nginx -t"
}

# 執行部署
main 