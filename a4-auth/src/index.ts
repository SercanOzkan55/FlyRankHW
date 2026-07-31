import express, { NextFunction, Request, Response } from "express";
import { loadConfig } from "./config";
import { createSupabaseClient } from "./supabase";
import { createAuthRouter } from "./routes/authRoutes";
import { createPublicRouter } from "./routes/publicRoutes";
import { createProtectedRouter } from "./routes/protectedRoutes";

const config = loadConfig();
const supabase = createSupabaseClient(config);

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(createPublicRouter());
app.use(createAuthRouter(supabase));
app.use(createProtectedRouter());

// Anything that escapes a route handler becomes a 500 without leaking internals.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(
    `Server running and connected to Supabase (port ${config.port}, project ${config.supabaseUrl})`
  );
});

export { app, supabase };
