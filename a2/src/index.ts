import "dotenv/config";
import express from "express";
import { createTaskRouter } from "./routes";
import { TaskService } from "./taskService";
import { TaskRepository } from "./types";
import { MemoryTaskRepository } from "./repositories/memoryTaskRepository";
import { PostgresTaskRepository } from "./repositories/postgresTaskRepository";
import { createPool } from "./db";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

function buildRepository(): TaskRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresTaskRepository(createPool());
  }
  return new MemoryTaskRepository();
}

const repository = buildRepository();
const service = new TaskService(repository);

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(createTaskRouter(service));

app.listen(PORT, () => {
  const storeKind = process.env.DATABASE_URL ? "postgres" : "memory";
  console.log(`a2-service listening on port ${PORT} (store: ${storeKind})`);
});
