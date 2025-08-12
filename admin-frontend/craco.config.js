// CRACO 配置文件 - 簡化版本
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

      return webpackConfig;
    },
  },
  devServer: {
    port: 3002,
    host: '0.0.0.0',
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
}; 