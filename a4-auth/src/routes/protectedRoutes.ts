import { Router } from "express";
import { extractBearerToken } from "../bearerToken";

export function createProtectedRouter(): Router {
  const router = Router();

  router.get("/protected/profile", (req, res) => {
    const token = extractBearerToken(req.header("authorization"));
    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Stage 3 replaces this with real verification against Supabase.
    res.status(200).json({ message: "Token received (not verified yet)" });
  });

  return router;
}
