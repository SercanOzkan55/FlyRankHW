import express from "express";
import { loadConfig } from "./config";
import { createSupabaseClient } from "./supabase";

const config = loadConfig();
const supabase = createSupabaseClient(config);

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(config.port, () => {
  console.log(
    `Server running and connected to Supabase (port ${config.port}, project ${config.supabaseUrl})`
  );
});

export { app, supabase };
