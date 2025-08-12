const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 資料庫配置
const DB_CONFIG = {
  path: path.join(__dirname, '../restaurant.db'),
  mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  verbose: process.env.NODE_ENV === 'development',
};

// 資料庫連接池配置
const POOL_CONFIG = {
  max: 10,
  min: 2,
  acquire: 30000,
  idle: 10000,
};

// 創建資料庫連接
function createDatabase () {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_CONFIG.path, DB_CONFIG.mode, (err) => {
      if (err) {
        console.error('資料庫連線失敗:', err.message);
        reject(err);
      } else {
        console.log('✅ 已連接 SQLite 資料庫');
        resolve(db);
      }
    });

    // 啟用 WAL 模式以提升效能
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA synchronous = NORMAL');
    db.run('PRAGMA cache_size = 10000');
    db.run('PRAGMA temp_store = MEMORY');

    return db;
  });
}

// 初始化資料庫表結構
function initDatabase (db) {
  return new Promise((resolve, reject) => {
    console.log('📊 初始化資料庫表結構...');

    const tables = [
      // 顧客資料表
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // 餐桌資料表
      `CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL,
        status TEXT DEFAULT 'available',
        area TEXT DEFAULT 'main',
        x INTEGER DEFAULT 0,
        y INTEGER DEFAULT 0,
        shape TEXT DEFAULT 'circle',
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // 訂位資料表
      `CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        table_id INTEGER,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        people INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE SET NULL
      )`,

      // 員工資料表
      `CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        account TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // 公休日資料表
      `CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // 可訂位時間時段資料表
      `CREATE TABLE IF NOT EXISTS time_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    // 創建索引以提升查詢效能
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(date, time)',
      'CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON reservations(table_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
      'CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status)',
      'CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date)',
      'CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(is_active)',
    ];

    db.serialize(() => {
      // 創建表
      tables.forEach((tableSQL, index) => {
        db.run(tableSQL, (err) => {
          if (err) {
            console.error(`創建表 ${index + 1} 失敗:`, err);
            reject(err);
          }
        });
      });

      // 創建索引
      indexes.forEach((indexSQL) => {
        db.run(indexSQL, (err) => {
          if (err) {
            console.error('創建索引失敗:', err);
          }
        });
      });

      // 插入預設資料
      const defaultData = [
        // 預設可訂位時間
        `INSERT OR IGNORE INTO time_slots (time, sort_order) VALUES 
          ('11:30', 1),
          ('12:30', 2),
          ('13:30', 3),
          ('14:30', 4),
          ('16:30', 5),
          ('17:30', 6),
          ('18:30', 7),
          ('19:30', 8)
        `,

        // 預設餐桌資料
        `INSERT OR IGNORE INTO tables (name, capacity, status, area, sort_order) VALUES 
          ('A1', 2, 'available', 'main', 1),
          ('A2', 2, 'available', 'main', 2),
          ('A3', 2, 'available', 'main', 3),
          ('B1', 4, 'available', 'main', 4),
          ('B2', 4, 'available', 'main', 5),
          ('B3', 4, 'available', 'main', 6),
          ('C1', 6, 'available', 'main', 7),
          ('C2', 6, 'available', 'main', 8)
        `,
      ];

      defaultData.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err) {
            console.error(`插入預設資料 ${index + 1} 失敗:`, err);
          }
        });
      });

      // 完成初始化
      db.run('SELECT 1', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ 資料庫初始化完成');
          resolve();
        }
      });
    });
  });
}

module.exports = {
  createDatabase,
  initDatabase,
  DB_CONFIG,
  POOL_CONFIG,
};
