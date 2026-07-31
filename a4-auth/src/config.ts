import "dotenv/config";

const DEFAULT_PORT = 3000;

export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  port: number;
}

/**
 * Reads configuration from the environment and fails fast when a required
 * secret is missing, so the server never starts half-configured.
 */
export function loadConfig(): AppConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !supabaseKey && "SUPABASE_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variable(s): ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in your Supabase project values."
    );
  }

  return {
    supabaseUrl: supabaseUrl as string,
    supabaseKey: supabaseKey as string,
    port: process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT,
  };
}
