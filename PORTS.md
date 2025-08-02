# 端口配置說明

## 🚀 服務端口分配

### 開發環境端口配置

| 服務 | 端口 | 說明 |
|------|------|------|
| **客戶端前端** | 3000 | React 客戶端應用 |
| **後端 API** | 3001 | Node.js + Express API 服務 |
| **管理後台** | 3002 | React 管理後台應用 |

### 端口配置檔案

#### 後端 (backend/index.js)
```javascript
const port = process.env.PORT || 3001;
```

#### 客戶端前端 (frontend/craco.config.js)
```javascript
devServer: {
  port: 3000,
},
```

#### 管理後台 (admin-frontend/craco.config.js)
```javascript
devServer: {
  port: 3002,
},
```

### API 端點配置

#### 前端 API 配置 (frontend/src/config.js)
```javascript
API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001'
```

#### 管理後台 API 配置 (admin-frontend/src/config.js)
```javascript
API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001'
```

## 🔧 環境變數

### 開發環境
- `REACT_APP_API_URL`: 可設定自定義 API 端點
- `PORT`: 可設定自定義端口

### 生產環境
- 建議使用環境變數設定端口和 API 端點
- 確保防火牆允許相應端口

## 📝 注意事項

1. **端口衝突**: 確保端口 3000、3001、3002 沒有被其他服務佔用
2. **CORS 設定**: 後端已配置允許所有來源的 CORS
3. **網路訪問**: 所有服務都配置為監聽 `0.0.0.0`，可通過 IP 地址訪問

## 🚀 啟動命令

```bash
# 同時啟動所有服務
npm start

# 分別啟動
npm run start:backend    # 後端 API (端口 3001)
npm run start:frontend   # 客戶端前端 (端口 3000)
npm run start:admin      # 管理後台 (端口 3002)
```

## 🌐 訪問地址

- **客戶端**: http://localhost:3000
- **管理後台**: http://localhost:3002
- **API**: http://localhost:3001 