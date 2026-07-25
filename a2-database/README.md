<<<<<<< HEAD
# Task Management CRUD API with SQLite Persistence (W3 · A1)

A RESTful CRUD API for task management built with **Node.js**, **Express**, and **SQLite**. This project demonstrates how database persistence replaces in-memory storage while keeping the exact same client-facing API interface.

---

## 🚀 Why SQLite Was Chosen

1. **Zero Configuration & Serverless**: SQLite runs as a lightweight, embedded database library directly within the application process. No separate database server installation or setup is required.
2. **Single-File Storage**: All data, schema definitions, and indexes are stored in a single cross-platform file (`tasks.db`), making it ideal for development, testing, and embedded backends.
3. **Full SQL Support**: Supports standard SQL queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `COUNT`, `LIKE`, `WHERE`), providing a great environment to learn relational database concepts.
4. **ACID Compliant & Persistent**: Ensures that all task operations survive server restarts.

---

## 📁 Database File Location

- **Database File**: `tasks.db`
- **Location**: Project root directory (`./tasks.db`)
- **Auto-Initialization**: Created automatically on first app startup if it does not exist.
- **Auto-Seeding**: Table `tasks` and 3 initial seed tasks are automatically created if missing or empty.

---

## 🛠️ How to Start the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Server
```bash
# Start production server
npm start

# Or run in development mode with auto-reload
npm run dev
```
The server will start on `http://localhost:3000`.

### 3. Run Automated Verification Tests
```bash
npm test
```

---

## 📊 Database Viewer (DB Browser for SQLite)

You can inspect and manipulate the database using any SQLite client (e.g. **DB Browser for SQLite** or VS Code SQLite extension).

### Opening `tasks.db`:
1. Download and open **DB Browser for SQLite** (https://sqlitebrowser.org/).
2. Click **Open Database** and select `./tasks.db` from the project directory.
3. Navigate to **Browse Data** to view the `tasks` table.

```
+----+----------------------------------+------+---------------------+---------------------+
| id | title                            | done | created_at          | updated_at          |
+----+----------------------------------+------+---------------------+---------------------+
| 1  | Learn SQLite basics              | 1    | 2026-07-25 16:45:00 | 2026-07-25 16:45:00 |
| 2  | Connect Express API to SQLite    | 0    | 2026-07-25 16:45:00 | 2026-07-25 16:45:00 |
| 3  | Test CRUD endpoints              | 0    | 2026-07-25 16:45:00 | 2026-07-25 16:45:00 |
+----+----------------------------------+------+---------------------+---------------------+
```

---

## 🔍 Stage 4: Executed SQL Queries

Here are the standard SQL queries used in Stage 4 to explore and verify the database:

### 1. List every task
```sql
SELECT * FROM tasks;
```

### 2. Show only completed tasks
```sql
SELECT * FROM tasks WHERE done = 1;
```

### 3. Count all tasks
```sql
SELECT COUNT(*) FROM tasks;
```

### 4. Mark every task as completed
```sql
UPDATE tasks SET done = 1;
```

### 5. Delete all completed tasks
```sql
DELETE FROM tasks WHERE done = 1;
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Request Body Example | Response Status |
|--------|----------|-------------|----------------------|-----------------|
| `GET` | `/tasks` | List all tasks (supports `search`, `done`, `sort`) | None | `200 OK` |
| `GET` | `/tasks/:id` | Get single task by ID | None | `200 OK` / `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `{"title": "Buy groceries", "done": false}` | `201 Created` / `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update an existing task | `{"title": "Updated title", "done": true}` | `200 OK` / `404 Not Found` / `400 Bad Request` |
| `DELETE` | `/tasks/:id` | Delete a task by ID | None | `200 OK` / `404 Not Found` |
| `GET` | `/stats` | Task statistics (total, completed, pending) | None | `200 OK` |

### Query Parameter Options (Optional Extras)

- **Search**: `GET /tasks?search=milk` (filters title via SQL `LIKE '%milk%'`)
- **Filter Completed**: `GET /tasks?done=true` or `GET /tasks?done=false`
- **Sort**: `GET /tasks?sort=title` or `GET /tasks?sort=desc`
- **Combined Example**: `GET /tasks?search=code&done=false&sort=asc`

---

## 📝 Data Schema (`tasks` table)

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

*Note: In API JSON responses, the `done` integer (`0`/`1`) is cleanly converted to native JSON boolean (`false`/`true`).*
=======
# FlyRankHW

General homework folder, one subfolder per assignment.

- [`w1/`](w1/) — Smallest Possible Backend: a tiny Node.js server with two JSON endpoints.
- [`a2/`](a2/) — A2 Task Service: Express + TypeScript API with a swappable in-memory /
  Postgres repository, run via Docker Compose (app + db + persistent volume).
- [`a3/`](a3/) — A3 Scraper: polite fetch → parse → extract → clean → structure
  pipeline against books.toscrape.com, robots.txt-aware and rate-limited. See
  [`a3/NOTES.md`](a3/NOTES.md) for the write-up.
- [`identity-kit/`](identity-kit/) — W3 Identity Kit: type, palette, logo
  mark, and style note as a single self-contained page.
- [`curated-images/`](curated-images/) — W3 Curate Your Images: the kept
  image set, what was rejected and why, and where real captures beat
  generated ones. See [`curated-images/README.md`](curated-images/README.md).
>>>>>>> 54cc0e86975dbc24823d5d0bd0af5d2fcae6b0ad
