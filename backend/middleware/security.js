const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// 基本安全配置
const securityConfig = {
  // Helmet 安全標頭配置
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        scriptSrc: ['\'self\'', '\'unsafe-inline\''],
        connectSrc: ['\'self\''],
        frameSrc: ['\'self\'', 'https://www.google.com'],
        objectSrc: ['\'none\''],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  },

  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 每個 IP 在 windowMs 內最多 100 個請求
    message: {
      error: '請求過於頻繁，請稍後再試',
      retryAfter: '15 分鐘',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // API 速率限制（更嚴格）
  apiRateLimit: {
    windowMs: 5 * 60 * 1000, // 5 分鐘
    max: 5000, // 放寬一般 API 限制
    message: {
      error: 'API 請求過於頻繁，請稍後再試',
      retryAfter: '5 分鐘',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // 訂位 API 速率限制（防止濫用）
  reservationRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 20, // 放寬：15 分鐘 20 次
    message: {
      error: '訂位請求過於頻繁，請稍後再試',
      retryAfter: '15 分鐘',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// 創建速率限制器
function createRateLimiters () {
  return {
    general: rateLimit(securityConfig.rateLimit),
    api: rateLimit(securityConfig.apiRateLimit),
    reservation: rateLimit(securityConfig.reservationRateLimit),
  };
}

// 配置安全中間件
function configureSecurity (app) {
  // 啟用壓縮
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // 配置 Helmet
  app.use(helmet(securityConfig.helmet));

  // 創建速率限制器
  const limiters = createRateLimiters();

  // 僅對 API 路由套用速率限制，避免靜態資源被誤計入
  app.use('/api/reservations', limiters.reservation); // 訂位 API 特殊限制
  app.use('/api', limiters.api); // 一般 API 限制

  // CORS 配置
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400'); // 24 小時

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // 請求日誌中間件
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // 錯誤處理中間件
  app.use((err, req, res, _next) => {
    console.error('錯誤:', err);

    // 根據錯誤類型返回適當的響應
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: '請求格式錯誤',
        message: '請檢查 JSON 格式是否正確',
      });
    }

    if (err.type === 'entity.too.large') {
      return res.status(413).json({
        error: '請求過大',
        message: '請求內容超過允許的大小',
      });
    }

    res.status(500).json({
      error: '內部伺服器錯誤',
      message: process.env.NODE_ENV === 'development' ? err.message : '請稍後再試',
    });
  });
}

module.exports = {
  configureSecurity,
  securityConfig,
  createRateLimiters,
};
