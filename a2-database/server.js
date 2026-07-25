const express = require('express');
const { queryAll, queryGet, queryRun, formatTask, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Task CRUD API is running!',
    endpoints: {
      tasks: '/tasks',
      stats: '/stats',
    },
  });
});

// GET /tasks - List all tasks (with optional search, filter, sorting)
app.get('/tasks', async (req, res) => {
  try {
    const { search, done, sort } = req.query;
    let sql = 'SELECT * FROM tasks';
    const conditions = [];
    const params = [];

    // Search by title (SQL LIKE operator)
    if (search && search.trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${search.trim()}%`);
    }

    // Filter by completed status (done=true or done=false)
    if (done !== undefined) {
      if (done === 'true' || done === '1') {
        conditions.push('done = 1');
      } else if (done === 'false' || done === '0') {
        conditions.push('done = 0');
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    if (sort) {
      const lowerSort = sort.toLowerCase();
      if (lowerSort === 'title' || lowerSort === 'asc' || lowerSort === 'title_asc') {
        sql += ' ORDER BY title ASC';
      } else if (lowerSort === 'desc' || lowerSort === 'title_desc') {
        sql += ' ORDER BY title DESC';
      } else if (lowerSort === 'id_desc') {
        sql += ' ORDER BY id DESC';
      } else {
        sql += ' ORDER BY id ASC';
      }
    } else {
      sql += ' ORDER BY id ASC';
    }

    const rows = await queryAll(sql, params);
    const tasks = rows.map(formatTask);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats - Return statistics about tasks (Optional Extra)
app.get('/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN done = 0 THEN 1 ELSE 0 END) AS pending
      FROM tasks;
    `;
    const result = await queryGet(sql);
    res.json({
      total: result ? result.total || 0 : 0,
      completed: result ? result.completed || 0 : 0,
      pending: result ? result.pending || 0 : 0,
    });
  } catch (err) {
    console.error('Error calculating statistics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /tasks/:id - Get task by ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const row = await queryGet('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(formatTask(row));
  } catch (err) {
    console.error('Error fetching task by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks - Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, done } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const isDone = done === true || done === 1 || done === 'true' ? 1 : 0;
    const cleanTitle = title.trim();

    const result = await queryRun(
      'INSERT INTO tasks (title, done) VALUES (?, ?);',
      [cleanTitle, isDone]
    );

    const newRow = await queryGet('SELECT * FROM tasks WHERE id = ?;', [result.lastID]);
    res.status(201).json(formatTask(newRow));
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existingRow = await queryGet('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    if (!existingRow) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, done } = req.body || {};

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existingRow.title;
    const updatedDone = done !== undefined ? (done === true || done === 1 || done === 'true' ? 1 : 0) : existingRow.done;

    await queryRun(
      'UPDATE tasks SET title = ?, done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
      [updatedTitle, updatedDone, taskId]
    );

    const updatedRow = await queryGet('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    res.json(formatTask(updatedRow));
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existingRow = await queryGet('SELECT * FROM tasks WHERE id = ?;', [taskId]);
    if (!existingRow) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await queryRun('DELETE FROM tasks WHERE id = ?;', [taskId]);
    res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server after initializing DB
async function start() {
  await initDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
