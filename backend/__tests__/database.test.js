const { createDatabase, initDatabase } = require('../config/database');

describe('Database Configuration', () => {
  let db;

  afterEach(async () => {
    if (db) {
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  test('should create database connection', async () => {
    db = await createDatabase();
    expect(db).toBeDefined();
  });

  test('should initialize database tables', async () => {
    db = await createDatabase();
    await expect(initDatabase(db)).resolves.not.toThrow();
  });

  test('should create tables with correct structure', async () => {
    db = await createDatabase();
    await initDatabase(db);

    const tables = ['customers', 'tables', 'reservations', 'staff', 'holidays', 'time_slots'];

    for (const tableName of tables) {
      await new Promise((resolve, reject) => {
        db.get('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?', [tableName], (err, row) => {
          if (err) reject(err);
          else {
            expect(row).toBeDefined();
            expect(row.name).toBe(tableName);
            resolve();
          }
        });
      });
    }
  });
});
