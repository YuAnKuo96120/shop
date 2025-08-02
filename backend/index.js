const express = require('express');
const path = require('path');
const { createDatabase, initDatabase } = require('./config/database');
const { configureSecurity } = require('./middleware/security');
const { cachedFunctions, cacheInvalidators } = require('./utils/cache');

const app = express();
const port = process.env.PORT || 3001;

// 配置安全中間件
configureSecurity(app);

// 解析 JSON
app.use(express.json({ limit: '1mb' }));

// 提供靜態文件服務
app.use(express.static(path.join(__dirname)));

// 全域變數
let db = null;

// 初始化應用
async function initializeApp() {
  try {
    // 創建資料庫連接
    db = await createDatabase();
    
    // 初始化資料庫
    await initDatabase(db);
    
    // 啟動伺服器
    startServer();
  } catch (error) {
    console.error('初始化失敗:', error);
    process.exit(1);
  }
}

// 測試 API
app.get('/', (req, res) => {
  res.send('餐廳訂位系統後端運作中');
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API 根路徑
app.get('/api', (req, res) => {
  res.json({
    message: '餐廳訂位系統 API',
    version: '1.0.0',
    endpoints: {
      reservations: '/api/reservations',
      tables: '/api/admin/tables',
      holidays: '/api/holidays',
      timeSlots: '/api/time-slots',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// 新增訂位
app.post('/api/reservations', async (req, res) => {
  try {
    const { name, phone, date, time, people, table_id, email = '', note = '' } = req.body;
    
    // 驗證必填欄位
    if (!name || !phone || !date || !time || !people) {
      return res.status(400).json({ error: '請填寫完整資料' });
    }

    // 驗證人數限制
    if (people >= 5) {
      return res.status(400).json({ 
        error: '5人以上訂位請聯繫餐廳，我們將為您安排合適的座位，電話0900000000' 
      });
    }

    // 驗證日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: '日期格式錯誤' });
    }

    // 驗證時間格式
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: '時間格式錯誤' });
    }

    // 檢查是否為公休日
    const holidays = await cachedFunctions.getHolidays(db);
    const isHoliday = holidays.some(h => h.date === date);
    if (isHoliday) {
      return res.status(400).json({ error: '選擇的日期為公休日' });
    }

    // 如果有指定餐桌，驗證餐桌容量和時段衝突
    if (table_id) {
      const tables = await cachedFunctions.getTables(db);
      const table = tables.find(t => t.id === table_id && t.status === 'available');
      
      if (!table) {
        return res.status(400).json({ error: '餐桌不存在或不可用' });
      }
      
      // 驗證餐桌容量
      if (people === 3 && table.capacity !== 4) {
        return res.status(400).json({ error: '3人訂位只能選擇4人桌' });
      }
      if (people <= 2 && table.capacity !== 2 && table.capacity !== 4) {
        return res.status(400).json({ error: '1-2人訂位只能選擇2人桌或4人桌' });
      }
      if (people === 4 && table.capacity !== 4) {
        return res.status(400).json({ error: '4人訂位只能選擇4人桌' });
      }
      
      // 檢查時段衝突
      const conflictCheck = await new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM reservations WHERE table_id = ? AND date = ? AND time = ? AND status != ?',
          [table_id, date, time, 'cancelled'],
          (err, result) => {
            if (err) reject(err);
            else resolve(result.count > 0);
          }
        );
      });
      
      if (conflictCheck) {
        return res.status(400).json({ error: '該餐桌在此時段已被預訂' });
      }
    }

    // 處理訂位
    const customerCheck = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM customers WHERE phone = ?', [phone], (err, customer) => {
        if (err) reject(err);
        else resolve(customer);
      });
    });

    let customerId;
    if (customerCheck) {
      customerId = customerCheck.id;
    } else {
      const newCustomer = await new Promise((resolve, reject) => {
        db.run('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)', 
          [name, phone, email], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      customerId = newCustomer;
    }

    // 創建訂位
    const reservation = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO reservations (customer_id, table_id, date, time, people, note) VALUES (?, ?, ?, ?, ?, ?)`,
        [customerId, table_id || null, date, time, people, note], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    // 清除相關快取
    cacheInvalidators.invalidateReservations();

    res.json({ success: true, reservationId: reservation.id });
  } catch (error) {
    console.error('新增訂位失敗:', error);
    res.status(500).json({ error: '新增訂位失敗' });
  }
});

// 查詢訂位（用電話查）
app.get('/api/reservations', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: '請提供電話' });
    }

    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM customers WHERE phone = ?', [phone], (err, customer) => {
        if (err) reject(err);
        else resolve(customer);
      });
    });

    if (!customer) {
      return res.status(404).json({ error: '查無顧客' });
    }

    const reservations = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM reservations WHERE customer_id = ? ORDER BY date DESC, time DESC', 
        [customer.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(reservations);
  } catch (error) {
    console.error('查詢訂位失敗:', error);
    res.status(500).json({ error: '查詢訂位失敗' });
  }
});

// 查詢所有訂位（後台用）
app.get('/api/admin/reservations', async (req, res) => {
  try {
    const reservations = await new Promise((resolve, reject) => {
      db.all(`SELECT r.id, c.name, c.phone, r.date, r.time, r.people, r.status, r.table_id, t.name as table_name
              FROM reservations r
              LEFT JOIN customers c ON r.customer_id = c.id
              LEFT JOIN tables t ON r.table_id = t.id
              ORDER BY r.date DESC, r.time DESC`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(reservations);
  } catch (error) {
    console.error('查詢訂位失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

// 檢查餐桌在指定日期時段的可用性
app.get('/api/check-table-availability', async (req, res) => {
  try {
    const { date, time } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ error: '請提供日期和時段' });
    }

    const tablesWithAvailability = await cachedFunctions.getTableAvailability(db, date, time);
    res.json(tablesWithAvailability);
  } catch (error) {
    console.error('檢查餐桌可用性失敗:', error);
    res.status(500).json({ error: '檢查可用性失敗' });
  }
});

// 查詢所有餐桌（後台用）
app.get('/api/admin/tables', async (req, res) => {
  try {
    const tables = await cachedFunctions.getTables(db);
    res.json(tables);
  } catch (error) {
    console.error('查詢餐桌失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

// 新增餐桌
app.post('/api/admin/tables', async (req, res) => {
  try {
    const { name, capacity, status, area, sort_order } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ error: '請填寫完整資料' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO tables (name, capacity, status, area, sort_order) VALUES (?, ?, ?, ?, ?)', 
        [name, capacity, status || 'available', area || 'main', sort_order || null], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    cacheInvalidators.invalidateTables();
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('新增餐桌失敗:', error);
    res.status(500).json({ error: '新增失敗' });
  }
});

// 編輯餐桌
app.put('/api/admin/tables/:id', async (req, res) => {
  try {
    const { name, capacity, status, area, sort_order } = req.body;
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE tables SET name = ?, capacity = ?, status = ?, area = ?, sort_order = ? WHERE id = ?', 
        [name, capacity, status, area || 'main', sort_order || null, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此餐桌' });
    }

    cacheInvalidators.invalidateTables();
    res.json({ success: true });
  } catch (error) {
    console.error('更新餐桌失敗:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

// 刪除餐桌
app.delete('/api/admin/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM tables WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此餐桌' });
    }

    cacheInvalidators.invalidateTables();
    res.json({ success: true });
  } catch (error) {
    console.error('刪除餐桌失敗:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

// 更新桌位座標
app.patch('/api/admin/tables/:id/position', async (req, res) => {
  try {
    const { x, y } = req.body;
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE tables SET x = ?, y = ? WHERE id = ?', [x, y, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此餐桌' });
    }

    cacheInvalidators.invalidateTables();
    res.json({ success: true });
  } catch (error) {
    console.error('更新座標失敗:', error);
    res.status(500).json({ error: '更新座標失敗' });
  }
});

// 取消訂位
app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此訂位' });
    }

    cacheInvalidators.invalidateReservations();
    res.json({ success: true });
  } catch (error) {
    console.error('取消訂位失敗:', error);
    res.status(500).json({ error: '取消失敗' });
  }
});

// 標記到店
app.post('/api/reservations/:id/arrive', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE reservations SET status = ? WHERE id = ?', ['arrived', id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此訂位' });
    }

    cacheInvalidators.invalidateReservations();
    res.json({ success: true });
  } catch (error) {
    console.error('標記到店失敗:', error);
    res.status(500).json({ error: '標記到店失敗' });
  }
});

// 刪除所有訂位（管理員功能）
app.delete('/api/admin/reservations/all', async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM reservations', [], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    cacheInvalidators.invalidateReservations();
    res.json({ success: true, deletedCount: result.changes });
  } catch (error) {
    console.error('刪除所有訂位失敗:', error);
    res.status(500).json({ error: '刪除所有訂位失敗' });
  }
});

// 公休日相關 API
app.get('/api/admin/holidays', async (req, res) => {
  try {
    const holidays = await cachedFunctions.getHolidays(db);
    res.json(holidays);
  } catch (error) {
    console.error('查詢公休日失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

app.post('/api/admin/holidays', async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) {
      return res.status(400).json({ error: '請選擇日期' });
    }
    
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO holidays (date, reason) VALUES (?, ?)', [date, reason || ''], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    cacheInvalidators.invalidateHolidays();
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('新增公休日失敗:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '此日期已設定為公休日' });
    }
    res.status(500).json({ error: '新增失敗' });
  }
});

app.put('/api/admin/holidays/:id', async (req, res) => {
  try {
    const { date, reason } = req.body;
    const { id } = req.params;
    
    if (!date) {
      return res.status(400).json({ error: '請選擇日期' });
    }
    
    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE holidays SET date = ?, reason = ? WHERE id = ?', [date, reason || '', id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此公休日' });
    }

    cacheInvalidators.invalidateHolidays();
    res.json({ success: true });
  } catch (error) {
    console.error('更新公休日失敗:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '此日期已設定為公休日' });
    }
    res.status(500).json({ error: '更新失敗' });
  }
});

app.delete('/api/admin/holidays/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM holidays WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此公休日' });
    }

    cacheInvalidators.invalidateHolidays();
    res.json({ success: true });
  } catch (error) {
    console.error('刪除公休日失敗:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

// 檢查指定日期是否為公休日
app.get('/api/check-holiday/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const holidays = await cachedFunctions.getHolidays(db);
    const holiday = holidays.find(h => h.date === date);
    res.json({ isHoliday: !!holiday, holiday });
  } catch (error) {
    console.error('查詢公休日失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

// 獲取所有公休日（公開 API）
app.get('/api/holidays', async (req, res) => {
  try {
    const holidays = await cachedFunctions.getHolidays(db);
    res.json(holidays);
  } catch (error) {
    console.error('查詢公休日失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

// 可訂位時間管理 API
app.get('/api/admin/time-slots', async (req, res) => {
  try {
    const timeSlots = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM time_slots ORDER BY sort_order, time', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(timeSlots);
  } catch (error) {
    console.error('查詢可訂位時間失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

app.post('/api/admin/time-slots', async (req, res) => {
  try {
    const { time, sort_order } = req.body;
    if (!time) {
      return res.status(400).json({ error: '請填寫時間' });
    }
    
    // 驗證時間格式 (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: '時間格式錯誤，請使用 HH:MM 格式' });
    }
    
    const result = await new Promise((resolve, reject) => {
      db.run('INSERT INTO time_slots (time, sort_order) VALUES (?, ?)', 
        [time, sort_order || 0], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    cacheInvalidators.invalidateTimeSlots();
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('新增可訂位時間失敗:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '此時間已存在' });
    }
    res.status(500).json({ error: '新增失敗' });
  }
});

app.put('/api/admin/time-slots/:id', async (req, res) => {
  try {
    const { time, sort_order } = req.body;
    const { id } = req.params;
    
    if (!time) {
      return res.status(400).json({ error: '請填寫時間' });
    }
    
    // 驗證時間格式 (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: '時間格式錯誤，請使用 HH:MM 格式' });
    }
    
    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE time_slots SET time = ?, sort_order = ? WHERE id = ?', 
        [time, sort_order || 0, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此時段' });
    }

    cacheInvalidators.invalidateTimeSlots();
    res.json({ success: true });
  } catch (error) {
    console.error('更新可訂位時間失敗:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '此時間已存在' });
    }
    res.status(500).json({ error: '更新失敗' });
  }
});

app.delete('/api/admin/time-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM time_slots WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此時段' });
    }

    cacheInvalidators.invalidateTimeSlots();
    res.json({ success: true });
  } catch (error) {
    console.error('刪除可訂位時間失敗:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

app.patch('/api/admin/time-slots/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('UPDATE time_slots SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?', 
        [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: '查無此時段' });
    }

    cacheInvalidators.invalidateTimeSlots();
    res.json({ success: true });
  } catch (error) {
    console.error('切換可訂位時間狀態失敗:', error);
    res.status(500).json({ error: '切換狀態失敗' });
  }
});

// 獲取所有啟用的可訂位時間（公開 API）
app.get('/api/time-slots', async (req, res) => {
  try {
    const timeSlots = await cachedFunctions.getTimeSlots(db);
    res.json(timeSlots);
  } catch (error) {
    console.error('查詢可訂位時間失敗:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

// 404 處理
app.use((req, res) => {
  console.log(`404 - 找不到路徑: ${req.path}`);
  res.status(404).json({ error: '找不到路徑', path: req.path });
});

// 啟動伺服器函數
function startServer() {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 後端伺服器啟動於 port ${port}`);
    console.log(`伺服器地址: http://0.0.0.0:${port}`);
    console.log('✅ 服務已準備就緒');
  });
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('關閉資料庫連接失敗:', err);
      } else {
        console.log('資料庫連接已關閉');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉伺服器...');
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('關閉資料庫連接失敗:', err);
      } else {
        console.log('資料庫連接已關閉');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// 初始化應用
initializeApp(); 