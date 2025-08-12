# Railway 部署說明

## 🚀 Railway 部署優勢

Railway 是一個現代化的雲端平台，非常適合部署 Node.js 應用程式：

- ✅ **自動 HTTPS**：免費 SSL 證書
- ✅ **自動擴展**：根據流量自動調整資源
- ✅ **全球 CDN**：快速全球訪問
- ✅ **簡單部署**：Git 連接自動部署
- ✅ **環境變數管理**：安全的配置管理

## 📋 前置需求

1. 註冊 [Railway 帳號](https://railway.app/)
2. 安裝 [Railway CLI](https://docs.railway.app/develop/cli)
3. 確保專案已推送到 GitHub

## 🚀 快速部署

### 方法 1：使用 Railway Dashboard（推薦）

1. **連接 GitHub 倉庫**
   - 登入 Railway Dashboard
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 選擇您的餐廳管理系統倉庫

2. **自動建置**
   - Railway 會自動檢測 Dockerfile
   - 自動建置和部署
   - 分配唯一的域名

3. **設定環境變數**
   - 在 Railway Dashboard 中設定環境變數
   - Railway 會自動提供 `$PORT` 變數

### 方法 2：使用 Railway CLI

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入 Railway
railway login

# 初始化專案
railway init

# 部署
railway up
```

## ⚙️ 環境變數設定

在 Railway Dashboard 中設定以下環境變數：

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_url
```

**注意**：`$PORT` 變數會由 Railway 自動提供，無需手動設定。

## 🌐 訪問地址

部署完成後，Railway 會提供：

- **主域名**：`https://your-app-name.railway.app`
- **前端**：`https://your-app-name.railway.app`
- **管理後台**：`https://your-app-name.railway.app/admin`
- **API 端點**：`https://your-app-name.railway.app/api`

## 🔧 自定義域名

1. 在 Railway Dashboard 中點擊您的專案
2. 進入 "Settings" 標籤
3. 在 "Domains" 部分添加自定義域名
4. 按照指示設定 DNS 記錄

## 📊 監控和日誌

### 查看日誌
```bash
# 使用 Railway CLI
railway logs

# 或在 Dashboard 中查看
```

### 監控指標
- CPU 使用率
- 記憶體使用率
- 網路流量
- 響應時間

## 🚨 故障排除

### 常見問題

1. **建置失敗**
   - 檢查 Dockerfile 語法
   - 確認所有依賴都已安裝
   - 查看建置日誌

2. **應用程式無法啟動**
   - 檢查環境變數設定
   - 確認端口配置正確
   - 查看應用程式日誌

3. **靜態資源無法載入**
   - 確認 nginx 配置正確
   - 檢查檔案路徑

### 調試命令

```bash
# 查看容器狀態
railway status

# 進入容器
railway shell

# 重啟服務
railway restart
```

## 🔄 更新部署

### 自動更新
- 推送到 GitHub 主分支會自動觸發部署
- Railway 會自動建置新版本

### 手動更新
```bash
# 強制重新部署
railway up --force
```

## 💰 成本控制

- **免費層級**：每月 $5 免費額度
- **按使用付費**：僅支付實際使用的資源
- **自動休眠**：閒置時自動休眠節省成本

## 📱 移動端優化

Railway 部署的應用程式自動支援：
- 響應式設計
- PWA 功能
- 快速載入
- 離線支援

## 🔒 安全性

- 自動 HTTPS
- 環境變數加密
- 網路隔離
- 定期安全更新

## 📞 支援

- [Railway 文檔](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/railway)

---

部署完成後，您的餐廳管理系統就可以在全球範圍內訪問了！🎉 