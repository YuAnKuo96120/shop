# Railway 優化版 Dockerfile
# 使用多階段建置優化映像大小和建置速度

# 第一階段：依賴安裝
FROM node:18-alpine AS deps
WORKDIR /app

# 安裝必要的工具
RUN apk add --no-cache git

# 複製 package.json 檔案
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY admin-frontend/package*.json ./admin-frontend/
COPY backend/package*.json ./backend/

# 設定 npm 配置
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-timeout 600000
RUN npm config set cache /tmp/.npm

# 安裝所有依賴
RUN npm ci --no-audit --no-fund --prefer-offline
WORKDIR /app/frontend && npm ci --no-audit --no-fund --prefer-offline
WORKDIR /app/admin-frontend && npm ci --no-audit --no-fund --prefer-offline
WORKDIR /app/backend && npm ci --no-audit --no-fund --prefer-offline

# 第二階段：前端建置
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/admin-frontend/node_modules ./admin-frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# 複製原始碼
COPY . .

# 建置前端
WORKDIR /app/frontend
RUN npm run build

# 建置管理前端
WORKDIR /app/admin-frontend
RUN npm run build

# 第三階段：生產映像
FROM nginx:alpine AS production

# 安裝 Node.js
RUN apk add --no-cache nodejs npm

# 複製建置後的靜態檔案
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html
COPY --from=frontend-builder /app/admin-frontend/build /usr/share/nginx/html/admin

# 複製 nginx 配置
COPY nginx-railway.conf /etc/nginx/nginx.conf

# 複製後端檔案
COPY --from=frontend-builder /app/backend /app/backend

# 設定後端工作目錄
WORKDIR /app/backend

# 安裝後端生產依賴
RUN npm ci --only=production --no-audit --no-fund

# 複製啟動腳本
COPY railway-start.sh /app/railway-start.sh
RUN chmod +x /app/railway-start.sh

# 創建必要的目錄
RUN mkdir -p /var/log/nginx /var/cache/nginx

# 暴露端口（Railway 會自動分配）
EXPOSE $PORT

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# 啟動腳本
CMD ["/app/railway-start.sh"] 

