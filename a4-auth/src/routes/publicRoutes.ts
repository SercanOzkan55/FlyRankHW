import { Router } from "express";

export function createPublicRouter(): Router {
  const router = Router();

  router.get("/public/info", (_req, res) => {
    res.status(200).json({ message: "Welcome stranger! This info is public." });
  });

  return router;
}
