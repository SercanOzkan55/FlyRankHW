export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
}

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}
