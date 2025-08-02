# 餐廳管理系統

一個完整的餐廳管理系統，包含客戶端訂位系統和管理後台。

## 🚀 快速開始

### 安裝依賴
```bash
npm run install:all
```

### 啟動服務
```bash
# 同時啟動所有服務
npm start

# 或分別啟動
npm run start:backend    # 後端 API (端口 3001)
npm run start:frontend   # 客戶端前端 (端口 3000)
npm run start:admin      # 管理後台 (端口 3002)
```

### 建置生產版本
```bash
npm run build
```

## 📁 專案結構

```
restaurant-system/
├── backend/           # 後端 API 服務
│   ├── index.js      # 主要服務檔案
│   └── restaurant.db # SQLite 資料庫
├── frontend/          # 客戶端前端
│   └── src/          # React 源碼
├── admin-frontend/    # 管理後台前端
│   └── src/          # React 源碼
└── package.json       # 專案配置
```

## 🎯 功能特色

### 客戶端
- 線上訂位
- 查看餐桌狀態
- 選擇用餐時間

### 管理後台
- 餐桌管理
- 訂位管理
- 時段設定
- 公休日管理

## 🛠️ 技術架構

- **前端**: React + TypeScript
- **後端**: Node.js + Express
- **資料庫**: SQLite
- **建置工具**: Webpack + CRACO

## 📝 授權

ISC License 