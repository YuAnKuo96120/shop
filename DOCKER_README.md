# Docker 部署說明

## 概述

這個專案現在支援 Docker 部署，可以輕鬆地在任何支援 Docker 的環境中運行餐廳管理系統。

## 前置需求

1. 安裝 Docker Desktop（Windows/Mac）或 Docker Engine（Linux）
2. 確保 Docker 服務正在運行

## 快速開始

### 方法 1：使用建置腳本（推薦）

#### Windows
```bash
build-docker.bat
```

#### Linux/Mac
```bash
chmod +x build-docker.sh
./build-docker.sh
```

### 方法 2：手動建置

```bash
docker build -t restaurant-system .
```

### 方法 3：使用 Docker Compose

```bash
docker-compose up -d
```

## 運行容器

### 單一容器
```bash
docker run -p 80:80 -p 3000:3000 restaurant-system
```

### 使用 Docker Compose
```bash
docker-compose up -d
```

## 訪問應用程式

- 前端：http://localhost
- 管理後台：http://localhost/admin
- 後端 API：http://localhost:3000

## 開發環境

要啟動開發環境，使用：

```bash
docker-compose --profile dev up -d
```

這將啟動：
- 後端開發服務（端口 3001）
- 前端開發服務（端口 3000）
- 管理後台開發服務（端口 3002）

## 故障排除

### 常見問題

1. **建置失敗**：確保所有依賴都已正確安裝
2. **端口衝突**：檢查端口 80 和 3000 是否被其他服務佔用
3. **權限問題**：在 Linux 上可能需要使用 `sudo`

### 日誌查看

```bash
# 查看容器日誌
docker logs <container_id>

# 使用 Docker Compose 查看日誌
docker-compose logs
```

## 環境變數

可以在 `docker-compose.yml` 中設定環境變數：

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=your_database_url
```

## 資料持久化

資料庫檔案會自動掛載到容器中，確保資料不會丟失。

## 更新部署

要更新部署，重新建置映像：

```bash
docker build -t restaurant-system .
docker-compose down
docker-compose up -d
``` 