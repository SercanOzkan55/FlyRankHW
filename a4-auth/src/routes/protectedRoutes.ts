import { Router } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { extractBearerToken } from "../bearerToken";
import { asyncRoute } from "../asyncRoute";
import { toProfile } from "../types";

export function createProtectedRouter(supabase: SupabaseClient): Router {
  const router = Router();

  router.get(
    "/protected/profile",
    asyncRoute(async (req, res) => {
      const token = extractBearerToken(req.header("authorization"));
      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      // Supabase is the authority on whether this JWT is genuine and current.
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      res.status(200).json({ profile: toProfile(data.user) });
    })
  );

  return router;
}
