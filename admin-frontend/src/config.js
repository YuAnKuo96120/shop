// API 配置
const config = {
  // 開發環境使用本地 API，生產環境使用託管服務 API
  API_URL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001'),
  
  // 管理前端路徑配置
  BASE_PATH: process.env.NODE_ENV === 'production' ? '/admin' : '',
};

export default config; 