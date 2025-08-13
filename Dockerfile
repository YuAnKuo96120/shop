# Railway 極簡版 Dockerfile
FROM mirror.gcr.io/library/node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 檔案（分開以最佳化快取）
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY admin-frontend/package*.json ./admin-frontend/
COPY backend/package*.json ./backend/

# 設定 npm 配置
RUN npm config set registry https://registry.npmjs.org/ \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-maxtimeout 120000

# 安裝前端依賴（強制包含 devDependencies 以取得 craco 等建置工具）
WORKDIR /app/frontend
RUN npm ci --include=dev --no-audit --no-fund || npm install --include=dev --no-audit --no-fund
WORKDIR /app/admin-frontend
RUN npm ci --include=dev --no-audit --no-fund || npm install --include=dev --no-audit --no-fund

# 回到根目錄並複製源碼
WORKDIR /app
COPY . .

# 建置前端與管理前端
WORKDIR /app/frontend
RUN NODE_OPTIONS=--max-old-space-size=512 npm run build

WORKDIR /app/admin-frontend
RUN NODE_OPTIONS=--max-old-space-size=512 PUBLIC_URL=/admin npm run build

# 安裝後端依賴（僅生產依賴）
WORKDIR /app/backend
RUN npm ci --omit=dev --no-audit --no-fund

# 回到根目錄並準備啟動腳本
WORKDIR /app
COPY railway-start.sh /app/railway-start.sh
RUN chmod +x /app/railway-start.sh

# 暴露端口（Railway 會注入 PORT，此處以預設值給建置期工具識別）
EXPOSE 3000

# 啟動腳本
CMD ["/app/railway-start.sh"]

