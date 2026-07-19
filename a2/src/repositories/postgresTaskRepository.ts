import { Pool } from "pg";
import { CreateTaskInput, Task, TaskRepository } from "../types";

interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  created_at: Date;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresTaskRepository implements TaskRepository {
  constructor(private pool: Pool) {}

  async findAll(): Promise<Task[]> {
    const result = await this.pool.query<TaskRow>(
      "SELECT id, title, done, created_at FROM tasks ORDER BY created_at ASC"
    );
    return result.rows.map(toTask);
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool.query<TaskRow>(
      "SELECT id, title, done, created_at FROM tasks WHERE id = $1",
      [id]
    );
    return result.rows[0] ? toTask(result.rows[0]) : null;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const result = await this.pool.query<TaskRow>(
      "INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING id, title, done, created_at",
      [input.title]
    );
    return toTask(result.rows[0]);
  }

  async update(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = patch.title ?? existing.title;
    const done = patch.done ?? existing.done;

    const result = await this.pool.query<TaskRow>(
      "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING id, title, done, created_at",
      [title, done, id]
    );
    return toTask(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
