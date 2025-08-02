// webpack 配置文件 - 處理棄用警告
const path = require('path');

module.exports = {
  // 禁用棄用警告
  ignoreWarnings: [
    /onAfterSetupMiddleware/,
    /onBeforeSetupMiddleware/,
    /fs\.F_OK/,
    /DEP0176/,
    /DEP_WEBPACK_DEV_SERVER/,
  ],
  
  // 其他配置
  resolve: {
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify")
    }
  }
}; 