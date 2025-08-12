// CRACO 配置文件 - 極簡版本
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
}; 