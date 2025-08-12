const NodeCache = require('node-cache');

// 快取配置
const CACHE_CONFIG = {
  stdTTL: 300, // 5 分鐘預設 TTL
  checkperiod: 60, // 每分鐘檢查過期項目
  useClones: false, // 不使用克隆以提升效能
  deleteOnExpire: true, // 自動刪除過期項目
  maxKeys: 1000, // 最大快取項目數
};

// 創建快取實例
const cache = new NodeCache(CACHE_CONFIG);

// 快取鍵前綴
const CACHE_KEYS = {
  TABLES: 'tables',
  HOLIDAYS: 'holidays',
  TIME_SLOTS: 'time_slots',
  RESERVATIONS: 'reservations',
  TABLE_AVAILABILITY: 'table_availability',
};

// 快取 TTL 配置（秒）
const CACHE_TTL = {
  TABLES: 300, // 5 分鐘
  HOLIDAYS: 3600, // 1 小時
  TIME_SLOTS: 1800, // 30 分鐘
  RESERVATIONS: 60, // 1 分鐘
  TABLE_AVAILABILITY: 30, // 30 秒
};

// 生成快取鍵
function generateCacheKey (prefix, ...params) {
  return `${prefix}:${params.join(':')}`;
}

// 快取包裝函數
function cacheWrapper (key, ttl, fn) {
  return async (...args) => {
    const cacheKey = typeof key === 'function' ? key(...args) : key;

    // 嘗試從快取獲取
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // 執行原始函數
    const result = await fn(...args);

    // 存入快取
    cache.set(cacheKey, result, ttl);

    return result;
  };
}

// 清除特定前綴的快取
function clearCacheByPrefix (prefix) {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.startsWith(prefix));
  cache.del(keysToDelete);
  console.log(`清除快取: ${keysToDelete.length} 個項目 (前綴: ${prefix})`);
}

// 清除所有快取
function clearAllCache () {
  cache.flushAll();
  console.log('清除所有快取');
}

// 獲取快取統計
function getCacheStats () {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    keyspace: cache.keys(),
  };
}

// 預設快取函數
const cachedFunctions = {
  // 餐桌資料快取
  getTables: cacheWrapper(
    CACHE_KEYS.TABLES,
    CACHE_TTL.TABLES,
    (db) => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM tables ORDER BY sort_order, id', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
  ),

  // 公休日資料快取
  getHolidays: cacheWrapper(
    CACHE_KEYS.HOLIDAYS,
    CACHE_TTL.HOLIDAYS,
    (db) => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM holidays ORDER BY date', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
  ),

  // 可訂位時間快取
  getTimeSlots: cacheWrapper(
    CACHE_KEYS.TIME_SLOTS,
    CACHE_TTL.TIME_SLOTS,
    (db) => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM time_slots WHERE is_active = 1 ORDER BY sort_order, time', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
  ),

  // 餐桌可用性快取
  getTableAvailability: cacheWrapper(
    (date, time) => generateCacheKey(CACHE_KEYS.TABLE_AVAILABILITY, date, time),
    CACHE_TTL.TABLE_AVAILABILITY,
    (db, date, time) => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM tables WHERE status = ? ORDER BY sort_order, id', ['available'], (err, tables) => {
          if (err) {
            reject(err);
            return;
          }

          // 檢查每個餐桌的可用性
          const checkAvailability = (tableId) => {
            return new Promise((resolve) => {
              db.get(
                'SELECT COUNT(*) as count FROM reservations WHERE table_id = ? AND date = ? AND time = ? AND status != ?',
                [tableId, date, time, 'cancelled'],
                (err, result) => {
                  if (err) {
                    resolve({ tableId, available: false });
                  } else {
                    const available = result.count === 0;
                    resolve({ tableId, available });
                  }
                },
              );
            });
          };

          Promise.all(tables.map(table => checkAvailability(table.id)))
            .then(results => {
              const availabilityMap = {};
              results.forEach(result => {
                availabilityMap[result.tableId] = result.available;
              });

              const tablesWithAvailability = tables.map(table => ({
                ...table,
                available: availabilityMap[table.id],
              }));

              resolve(tablesWithAvailability);
            })
            .catch(reject);
        });
      });
    },
  ),
};

// 快取失效函數
const cacheInvalidators = {
  // 清除餐桌相關快取
  invalidateTables: () => {
    clearCacheByPrefix(CACHE_KEYS.TABLES);
  },

  // 清除公休日相關快取
  invalidateHolidays: () => {
    clearCacheByPrefix(CACHE_KEYS.HOLIDAYS);
  },

  // 清除可訂位時間相關快取
  invalidateTimeSlots: () => {
    clearCacheByPrefix(CACHE_KEYS.TIME_SLOTS);
  },

  // 清除訂位相關快取
  invalidateReservations: () => {
    clearCacheByPrefix(CACHE_KEYS.RESERVATIONS);
    clearCacheByPrefix(CACHE_KEYS.TABLE_AVAILABILITY);
  },

  // 清除餐桌可用性快取
  invalidateTableAvailability: () => {
    clearCacheByPrefix(CACHE_KEYS.TABLE_AVAILABILITY);
  },
};

module.exports = {
  cache,
  CACHE_CONFIG,
  CACHE_KEYS,
  CACHE_TTL,
  generateCacheKey,
  cacheWrapper,
  cachedFunctions,
  cacheInvalidators,
  clearCacheByPrefix,
  clearAllCache,
  getCacheStats,
};
