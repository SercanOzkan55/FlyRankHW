import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfig } from "./config";

/**
 * Server-side clients are stateless: there is no browser to persist a session
 * in, and every request carries its own access token.
 */
const SERVER_CLIENT_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const;

export function createSupabaseClient(config: AppConfig): SupabaseClient {
  return createClient(
    config.supabaseUrl,
    config.supabaseKey,
    SERVER_CLIENT_OPTIONS
  );
}
