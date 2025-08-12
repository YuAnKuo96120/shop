# 🚀 餐廳管理系統部署指南

## 📋 系統架構

本系統採用微服務架構，包含以下組件：

| 服務 | 端口 | 路徑 | 說明 |
|------|------|------|------|
| **客戶端前端** | 3000 | `/frontend/` | React 客戶端應用 |
| **管理後台** | 3002 | `/admin/` | React 管理後台 |
| **後端 API** | 3001 | `/api/` | Node.js + Express API |

## 🌐 訪問地址

部署完成後，您可以通過以下地址訪問：

- **客戶端前端**: `http://192.168.1.100/frontend/`
- **管理後台**: `http://192.168.1.100/admin/`
- **API 端點**: `http://192.168.1.100/api/`

## 🔧 部署步驟

### 1. 環境準備

```bash
# 安裝 Node.js (建議 v16+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝 Nginx
sudo apt-get update
sudo apt-get install -y nginx

# 安裝 PM2 (進程管理)
sudo npm install -g pm2
```

### 2. 下載專案

```bash
git clone <your-repository-url>
cd restaurant-system
```

### 3. 配置域名

編輯 Nginx 配置文件，將 `192.168.1.100` 替換為您的實際 IP 地址：

```bash
# 編輯 nginx.conf 或 nginx-ssl.conf
sudo nano nginx.conf
```

### 4. 執行部署

```bash
# 給予執行權限
chmod +x deploy.sh

# 執行部署 (生產環境)
./deploy.sh production

# 或執行部署 (測試環境)
./deploy.sh staging
```

### 5. 驗證部署

```bash
# 檢查服務狀態
pm2 status

# 檢查 Nginx 配置
sudo nginx -t

# 查看日誌
pm2 logs
```

## 🔒 HTTPS 配置 (可選)

### 使用 Let's Encrypt

```bash
# 安裝 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 獲取 SSL 證書
sudo certbot --nginx -d 192.168.1.100

# 自動續期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 手動配置 SSL

1. 將您的 SSL 證書文件放在安全位置
2. 編輯 `nginx-ssl.conf` 中的證書路徑
3. 使用 SSL 配置重新部署

## 📊 監控與維護

### 常用命令

```bash
# 查看所有服務狀態
pm2 status

# 查看特定服務日誌
pm2 logs restaurant-backend

# 重啟服務
pm2 restart restaurant-backend

# 停止服務
pm2 stop restaurant-backend

# 重新載入 Nginx
sudo systemctl reload nginx

# 檢查 Nginx 配置
sudo nginx -t
```

### 日誌位置

- **PM2 日誌**: `~/.pm2/logs/`
- **Nginx 日誌**: `/var/log/nginx/`
- **系統日誌**: `/var/log/syslog`

## 🔧 故障排除

### 常見問題

1. **端口被佔用**
   ```bash
   # 檢查端口使用情況
   sudo netstat -tlnp | grep :3001
   
   # 殺死佔用進程
   sudo kill -9 <PID>
   ```

2. **Nginx 配置錯誤**
   ```bash
   # 測試配置
   sudo nginx -t
   
   # 查看錯誤日誌
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Node.js 服務無法啟動**
   ```bash
   # 檢查 Node.js 版本
   node --version
   
   # 重新安裝依賴
   npm install
   
   # 查看詳細錯誤
   pm2 logs --lines 100
   ```

### 性能優化

1. **啟用 Gzip 壓縮**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **配置快取**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **資料庫優化**
   ```bash
   # 定期備份資料庫
   sqlite3 restaurant.db ".backup backup_$(date +%Y%m%d).db"
   ```

## 🔄 更新部署

### 自動更新腳本

```bash
#!/bin/bash
# update.sh

echo "🔄 開始更新系統..."

# 拉取最新代碼
git pull origin main

# 重新安裝依賴
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd admin-frontend && npm install && cd ..

# 重新建置前端
cd frontend && npm run build && cd ..
cd admin-frontend && npm run build && cd ..

# 重啟服務
pm2 restart restaurant-backend

echo "✅ 更新完成！"
```

## 📞 支援

如果遇到問題，請檢查：

1. 系統日誌: `/var/log/syslog`
2. Nginx 日誌: `/var/log/nginx/`
3. PM2 日誌: `pm2 logs`
4. 網路連接: `curl -I http://localhost:3001/health`

## 📝 注意事項

- 確保防火牆開放必要端口 (80, 443)
- 定期備份資料庫和配置文件
- 監控系統資源使用情況
- 定期更新系統和依賴項 