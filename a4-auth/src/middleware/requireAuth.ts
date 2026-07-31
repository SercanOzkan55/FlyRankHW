import { NextFunction, RequestHandler, Response } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { extractBearerToken } from "../bearerToken";
import { AuthedRequest } from "../types";

/**
 * The single guard every protected route goes through: it extracts the bearer
 * token, verifies it with Supabase, and attaches the verified user to the
 * request. Route handlers only ever run for authenticated callers.
 */
export function requireAuth(supabase: SupabaseClient): RequestHandler {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req.header("authorization"));
    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    supabase.auth
      .getUser(token)
      .then(({ data, error }) => {
        if (error || !data.user) {
          res.status(401).json({ error: "Invalid or expired token" });
          return;
        }

        req.auth = { token, user: data.user };
        next();
      })
      .catch(next);
  };
}
