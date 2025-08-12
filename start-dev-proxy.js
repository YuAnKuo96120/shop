const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 靜態文件服務
app.use('/frontend', express.static(path.join(__dirname, 'frontend/build')));
app.use('/admin-frontend', express.static(path.join(__dirname, 'admin-frontend/build')));

// 代理配置
const frontendProxyConfig = {
  target: 'http://localhost:3000',
  changeOrigin: true
};

const adminProxyConfig = {
  target: 'http://localhost:3002',
  changeOrigin: true
};

const apiProxyConfig = {
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
};

// 前端代理
app.use('/frontend', createProxyMiddleware(frontendProxyConfig));
app.use('/admin-frontend', createProxyMiddleware(adminProxyConfig));

// API 代理
app.use('/api', createProxyMiddleware(apiProxyConfig));

// 前端路由處理 (SPA)
app.get('/frontend/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

app.get('/admin-frontend/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-frontend/public/index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log('開發代理伺服器運行中');
  console.log('前端: /frontend');
  console.log('管理後台: /admin-frontend');
  console.log('API: /api');
});