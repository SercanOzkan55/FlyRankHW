import { CreateTaskInput, Task, TaskRepository } from "./types";

export class TaskService {
  constructor(private repo: TaskRepository) {}

  listTasks(): Promise<Task[]> {
    return this.repo.findAll();
  }

  getTask(id: string): Promise<Task | null> {
    return this.repo.findById(id);
  }

  createTask(input: CreateTaskInput): Promise<Task> {
    if (!input.title || !input.title.trim()) {
      throw new Error("title is required");
    }
    return this.repo.create(input);
  }

  updateTask(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null> {
    return this.repo.update(id, patch);
  }

  deleteTask(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}
