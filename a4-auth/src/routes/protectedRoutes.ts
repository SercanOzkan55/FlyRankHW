import { Router } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/requireAuth";
import { AuthedRequest, toProfile } from "../types";

export function createProtectedRouter(supabase: SupabaseClient): Router {
  const router = Router();

  // Every route below this line is guarded by the same middleware.
  router.use("/protected", requireAuth(supabase));

  router.get("/protected/profile", (req: AuthedRequest, res) => {
    res.status(200).json({ profile: toProfile(req.auth!.user) });
  });

  router.get("/protected/dashboard", (req: AuthedRequest, res) => {
    res.status(200).json({
      message: `Welcome back, ${req.auth!.user.email ?? "user"}.`,
      widgets: [
        { name: "Audits run", value: 12 },
        { name: "Open issues", value: 3 },
      ],
    });
  });

  return router;
}
