# Railway 極簡版 Dockerfile
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 安裝 nginx
RUN apk add --no-cache nginx

# 複製 package.json 檔案
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY admin-frontend/package*.json ./admin-frontend/
COPY backend/package*.json ./backend/

# 設定 npm 配置
RUN npm config set registry https://registry.npmjs.org/

# 安裝依賴
RUN npm install
WORKDIR /app/frontend && npm install
WORKDIR /app/admin-frontend && npm install
WORKDIR /app/backend && npm install

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

# 回到根目錄
WORKDIR /app

# 創建 nginx 目錄
RUN mkdir -p /usr/share/nginx/html

# 複製建置後的檔案
RUN cp -r frontend/build/* /usr/share/nginx/html/
RUN mkdir -p /usr/share/nginx/html/admin
RUN cp -r admin-frontend/build/* /usr/share/nginx/html/admin/

# 複製 nginx 配置
COPY nginx-railway.conf /etc/nginx/nginx.conf

# 安裝後端依賴（僅生產依賴）
WORKDIR /app/backend
RUN npm ci --only=production

# 複製啟動腳本
COPY railway-start.sh /app/railway-start.sh
RUN chmod +x /app/railway-start.sh

# 暴露端口（Railway 會注入 PORT，此處以預設值給建置期工具識別）
EXPOSE 3000

# 啟動腳本
CMD ["/app/railway-start.sh"] 

