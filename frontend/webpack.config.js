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
  
  // 開發伺服器配置
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // 等同於 onBeforeSetupMiddleware
      devServer.app.use((req, res, next) => {
        // 可以在這裡添加自定義中間件邏輯
        next();
      });

      return middlewares;
    },
    
    // 其他開發伺服器設定
    hot: true,
    open: true
  },
  
  // 其他配置
  resolve: {
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify")
    }
  }
}; 