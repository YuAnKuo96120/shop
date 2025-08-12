# 棄用警告修復說明

## 已修復的問題

### 1. fs.F_OK 棄用警告 (DEP0176)
**問題**: `fs.F_OK is deprecated, use fs.constants.F_OK instead`

**解決方案**:
- 在 webpack 和 craco 配置中添加了警告過濾
- 設置 `NODE_OPTIONS=--no-deprecation` 來抑制 Node.js 棄用警告

### 2. Webpack Dev Server 棄用警告
**問題**: 
- `onAfterSetupMiddleware` 已棄用
- `onBeforeSetupMiddleware` 已棄用

**解決方案**:
- 更新了 craco 配置以使用新的 `setupMiddlewares` API
- 添加了警告過濾來抑制這些警告

### 3. API 路由 404 錯誤
**問題**: 前端調用 API 時返回 404 錯誤，因為缺少 `/api` 前綴

**解決方案**:
- 修復了前端 API 調用路徑，添加了 `/api` 前綴
- 更新了所有 admin-frontend 頁面的 API 調用
- 確保前端和後端 API 路由一致

## 配置文件更新

### 1. craco.config.js
- 添加了更全面的警告過濾
- 使用新的 `setupMiddlewares` API
- 配置了客戶端覆蓋層設置

### 2. package.json
- 在所有啟動腳本中添加了 `NODE_OPTIONS=--no-deprecation`
- 確保所有服務都使用相同的警告抑制設置

### 3. start.bat
- 創建了 Windows 批處理文件來統一啟動所有服務
- 設置環境變量來抑制警告

### 4. API 路由修復
- **frontend/src/utils/api.ts**: 修復所有 API 端點路徑
- **admin-frontend/src/pages/Tables.tsx**: 修復餐桌管理 API 調用
- **admin-frontend/src/pages/Holidays.tsx**: 修復公休日管理 API 調用
- **admin-frontend/src/pages/Reservations.tsx**: 修復訂位管理 API 調用
- **admin-frontend/src/pages/TimeSlots.tsx**: 已正確配置

## 使用方法

### 方法 1: 使用 npm 腳本
```bash
npm start
```

### 方法 2: 使用批處理文件 (Windows)
```bash
start.bat
```

### 方法 3: 單獨啟動服務
```bash
# 後端
cd backend && npm start

# 前端
cd frontend && npm start

# 管理前端
cd admin-frontend && npm start
```

### 方法 4: 測試 API
```bash
# 安裝 node-fetch (如果需要)
npm install node-fetch

# 運行 API 測試
node test-api.js
```

## 注意事項

1. 這些警告主要來自依賴包，不是你的代碼問題
2. 修復方案通過配置來抑制警告，不會影響功能
3. 建議定期更新依賴包以獲得最新的修復
4. API 路由現在已正確配置，前端應該能正常與後端通信

## 端口配置

- 後端: http://localhost:3001
- 前端: http://localhost:3000
- 管理前端: http://localhost:3002

## API 端點示例

- 健康檢查: `GET /health`
- API 根路徑: `GET /api`
- 餐桌管理: `GET /api/admin/tables`
- 公休日管理: `GET /api/admin/holidays`
- 時段管理: `GET /api/admin/time-slots`
- 訂位管理: `GET /api/admin/reservations` 