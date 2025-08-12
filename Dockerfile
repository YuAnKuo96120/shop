# 使用 Node.js 18 作為基礎映像
FROM node:18-alpine AS base

# 設定工作目錄
WORKDIR /app

# 複製 package.json 檔案
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY admin-frontend/package*.json ./admin-frontend/
COPY backend/package*.json ./backend/

# 安裝根目錄依賴
RUN npm install

# 安裝前端依賴
WORKDIR /app/frontend
RUN npm install

# 安裝管理前端依賴
WORKDIR /app/admin-frontend
RUN npm install

# 安裝後端依賴
WORKDIR /app/backend
RUN npm install

# 回到根目錄
WORKDIR /app

# 複製所有原始碼
COPY . .

# 建置前端
WORKDIR /app/frontend
RUN npm run build

# 建置管理前端
WORKDIR /app/admin-frontend
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製建置後的檔案到 nginx 目錄
COPY --from=base /app/frontend/build /usr/share/nginx/html
COPY --from=base /app/admin-frontend/build /usr/share/nginx/html/admin

# 複製 Railway 專用的 nginx 配置
COPY nginx-railway.conf /etc/nginx/nginx.conf

# 複製後端檔案
COPY --from=base /app/backend /app/backend

# 安裝 Node.js 到生產映像
RUN apk add --update nodejs npm

# 設定工作目錄
WORKDIR /app/backend

# 安裝後端依賴（僅生產依賴）
RUN npm ci --only=production

# 複製啟動腳本
COPY railway-start.sh /app/railway-start.sh
RUN chmod +x /app/railway-start.sh

# 暴露端口（Railway 會自動分配端口）
EXPOSE $PORT

# 使用 Railway 專用啟動腳本
CMD ["/app/railway-start.sh"] 

