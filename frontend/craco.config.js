// CRACO 配置文件 - 處理 webpack 棄用警告
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 禁用棄用警告
      webpackConfig.ignoreWarnings = [
        /onAfterSetupMiddleware/,
        /onBeforeSetupMiddleware/,
        /fs\.F_OK/,
        /DEP0176/,
        /DEP_WEBPACK_DEV_SERVER/,
        /DeprecationWarning/,
        /is deprecated/,
      ];

      // 設置 Node.js 選項
      if (webpackConfig.devServer) {
        webpackConfig.devServer.client = {
          ...webpackConfig.devServer.client,
          overlay: {
            warnings: false,
            errors: true,
          },
        };
      }

      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
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
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
}; 