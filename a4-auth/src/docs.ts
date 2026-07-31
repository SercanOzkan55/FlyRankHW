import fs from "fs";
import path from "path";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

const SPEC_PATH = path.join(__dirname, "..", "openapi.json");

/**
 * Serves Swagger UI at /docs from the hand-written openapi.json. The spec
 * lives next to the source (not inside it) so the same file is used whether
 * the server runs from src via ts-node-dev or from the compiled dist.
 */
export function createDocsRouter(): Router {
  const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));

  const router = Router();
  router.get("/openapi.json", (_req, res) => res.json(spec));
  router.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
  return router;
}
