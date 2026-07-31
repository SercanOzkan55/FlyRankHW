import { Router } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { asyncRoute } from "../asyncRoute";

interface Credentials {
  email: string;
  password: string;
}

/**
 * Accepts the body only when both fields are present, non-empty strings.
 * Anything else is a 400 before we ever talk to Supabase.
 */
function readCredentials(body: unknown): Credentials | null {
  if (typeof body !== "object" || body === null) return null;

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || email.trim() === "") return null;
  if (typeof password !== "string" || password === "") return null;

  return { email: email.trim(), password };
}

export function createAuthRouter(supabase: SupabaseClient): Router {
  const router = Router();

  router.post(
    "/auth/signup",
    asyncRoute(async (req, res) => {
      const credentials = readCredentials(req.body);
      if (!credentials) {
        return res.status(400).json({ error: "email and password are required" });
      }

      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) {
        return res.status(error.status ?? 400).json({ error: error.message });
      }

      res.status(201).json({ user: data.user });
    })
  );

  router.post(
    "/auth/login",
    asyncRoute(async (req, res) => {
      const credentials = readCredentials(req.body);
      if (!credentials) {
        return res.status(400).json({ error: "email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error || !data.session) {
        return res.status(401).json({ error: "Invalid login credentials" });
      }

      res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        user: data.user,
      });
    })
  );

  return router;
}
