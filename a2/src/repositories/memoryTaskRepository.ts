import { randomUUID } from "crypto";
import { CreateTaskInput, Task, TaskRepository } from "../types";

export class MemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}
