import { Router } from "express";
import { TaskService } from "./taskService";

export function createTaskRouter(service: TaskService): Router {
  const router = Router();

  router.get("/tasks", async (_req, res) => {
    res.json(await service.listTasks());
  });

  router.get("/tasks/:id", async (req, res) => {
    const task = await service.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "not found" });
    res.json(task);
  });

  router.post("/tasks", async (req, res) => {
    try {
      const task = await service.createTask({ title: req.body?.title });
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.patch("/tasks/:id", async (req, res) => {
    const task = await service.updateTask(req.params.id, {
      title: req.body?.title,
      done: req.body?.done,
    });
    if (!task) return res.status(404).json({ error: "not found" });
    res.json(task);
  });

  router.delete("/tasks/:id", async (req, res) => {
    const deleted = await service.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: "not found" });
    res.status(204).send();
  });

  return router;
}
