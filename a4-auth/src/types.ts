import { Request } from "express";
import { User } from "@supabase/supabase-js";

/** A request that has passed the auth middleware and carries a verified user. */
export interface AuthedRequest extends Request {
  auth?: {
    token: string;
    user: User;
  };
}

/** The subset of the Supabase user we expose to clients. */
export interface ProfileResponse {
  id: string;
  email: string | undefined;
  createdAt: string;
  lastSignInAt: string | undefined;
}

export function toProfile(user: User): ProfileResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  };
}
