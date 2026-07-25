const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'tasks.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', DB_PATH);
  }
});

// Helper for db.all (SELECT multiple)
function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper for db.get (SELECT single row)
function queryGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper for db.run (INSERT, UPDATE, DELETE)
function queryRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper to format SQLite row boolean conversion
function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

// Initialize schema and seed data if empty
async function initDatabase() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await queryRun(createTableSql);

  // Check if table is empty
  const countRow = await queryGet('SELECT COUNT(*) AS count FROM tasks;');
  if (countRow && countRow.count === 0) {
    console.log('Database table is empty. Inserting 3 seed tasks...');
    const seedTasks = [
      { title: 'Learn SQLite basics', done: 1 },
      { title: 'Connect Express API to SQLite', done: 0 },
      { title: 'Test CRUD endpoints', done: 0 },
    ];
    for (const task of seedTasks) {
      await queryRun('INSERT INTO tasks (title, done) VALUES (?, ?);', [task.title, task.done]);
    }
    console.log('Seed tasks inserted successfully.');
  }
}

module.exports = {
  db,
  queryAll,
  queryGet,
  queryRun,
  formatTask,
  initDatabase,
};
