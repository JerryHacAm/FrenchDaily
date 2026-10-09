import "server-only";

// All app settings come from .env (see .env.example). Never hardcode these
// values anywhere else in the code; import them from here.

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a whole number, got "${raw}"`);
  }
  return value;
}

function readMode(): "test" | "production" {
  const raw = process.env.APP_MODE ?? "test";
  if (raw !== "test" && raw !== "production") {
    throw new Error(`APP_MODE must be "test" or "production", got "${raw}"`);
  }
  return raw;
}

export const APP_MODE = readMode();
export const STREAK_MIN_WORDS = readNumber("STREAK_MIN_WORDS", 5);
export const MAX_CHECKS_PER_DAY = readNumber("MAX_CHECKS_PER_DAY", 50);
export const MIN_SENTENCE_WORDS = readNumber("MIN_SENTENCE_WORDS", 6);

// Secrets and service settings. Empty string means "not set yet".
export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY ?? "";
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
