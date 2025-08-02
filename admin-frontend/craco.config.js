// CRACO 配置文件 - 處理 webpack 棄用警告
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 禁用棄用警告
      webpackConfig.ignoreWarnings = [
        /onAfterSetupMiddleware/,
        /onBeforeSetupMiddleware/,
        /fs\.F_OK/,
      ];

      return webpackConfig;
    },
  },
  devServer: {
    port: 3002,
  },
}; 