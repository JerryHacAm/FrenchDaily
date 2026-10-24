import "server-only";
import type { Rules } from "@/lib/learning/rules";

// All app settings come from .env (see .env.example). Never hardcode these
// values anywhere else in the code, and never read process.env elsewhere;
// import them from here.

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a number of 0 or more, got "${raw}"`);
  }
  return value;
}

function readChoice<T extends string>(name: string, choices: readonly T[], fallback: T): T {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  if (!(choices as readonly string[]).includes(raw)) {
    throw new Error(`${name} must be one of ${choices.join(", ")}, got "${raw}"`);
  }
  return raw as T;
}

export const APP_MODE = readChoice("APP_MODE", ["test", "production"] as const, "test");

// Learning rules. Pure logic receives these as one object (see rules.ts).
export const STREAK_MIN_WORDS = readNumber("STREAK_MIN_WORDS", 5);
export const MAX_CHECKS_PER_DAY = readNumber("MAX_CHECKS_PER_DAY", 50);
export const MIN_SENTENCE_WORDS = readNumber("MIN_SENTENCE_WORDS", 6);

export const RULES: Rules = {
  streakMinWords: STREAK_MIN_WORDS,
  maxChecksPerDay: MAX_CHECKS_PER_DAY,
  minSentenceWords: MIN_SENTENCE_WORDS,
  minSentenceWordsLevel1: readNumber("MIN_SENTENCE_WORDS_LEVEL1", 4),
  maxSentenceChars: readNumber("MAX_SENTENCE_CHARS", 200),
  batchSize: readNumber("BATCH_SIZE", 5),
  wordBankDays: readNumber("WORD_BANK_DAYS", 3),
  wordBankMax: readNumber("WORD_BANK_MAX", 15),
  quietAfterDays: readNumber("QUIET_AFTER_DAYS", 4),
  themeDays: readNumber("THEME_DAYS", 7),
  roleplayMaxTurns: readNumber("ROLEPLAY_MAX_TURNS", 10),
};

// Where data is stored. "file" = a JSON file on this computer (development,
// no database needed). "supabase" = the real database (needed on Vercel).
export const STORAGE = readChoice("STORAGE", ["file", "supabase"] as const, "file");
export const DATA_DIR = process.env.DATA_DIR || ".data";
if (STORAGE === "file" && process.env.VERCEL) {
  throw new Error('STORAGE=file does not work on Vercel. Set STORAGE=supabase there.');
}

// Claude API (server only). AI_MODE=mock gives fake but realistic feedback,
// so the app works without an API key (development and tests).
export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY ?? "";
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "";
export const CLAUDE_EFFORT = readChoice(
  "CLAUDE_EFFORT",
  ["", "low", "medium", "high", "xhigh", "max"] as const,
  "",
);
export const AI_MODE = readChoice("AI_MODE", ["claude", "mock"] as const, CLAUDE_API_KEY ? "claude" : "mock");
if (AI_MODE === "claude" && (!CLAUDE_API_KEY || !CLAUDE_MODEL)) {
  throw new Error("AI_MODE=claude needs CLAUDE_API_KEY and CLAUDE_MODEL in .env");
}
// Prices in US dollars per million tokens, used only to log cost estimates.
export const AI_PRICE_INPUT_PER_MTOK = readNumber("AI_PRICE_INPUT_PER_MTOK", 0.1);
export const AI_PRICE_OUTPUT_PER_MTOK = readNumber("AI_PRICE_OUTPUT_PER_MTOK", 0.5);

// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const emailList = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// Emails allowed to open /stats when STORAGE=supabase (comma separated).
export const ADMIN_EMAILS = emailList(process.env.ADMIN_EMAILS);

// Invite-only: the only emails that can sign up and use the app when
// STORAGE=supabase (comma separated). ADMIN_EMAILS are always allowed.
// Empty = anyone can sign up (and spend your Claude credit).
export const ALLOWED_EMAILS = emailList(process.env.ALLOWED_EMAILS);

// Test shortcut (APP_MODE=test only): typing this word in any answer box skips
// every check and the AI, so the flow and the streak can be tested for free.
// Works for admins (ADMIN_EMAILS) and invited emails (ALLOWED_EMAILS), and
// locally with STORAGE=file. Empty = off.
export const TEST_BYPASS_CODE = APP_MODE === "test" ? (process.env.TEST_BYPASS_CODE ?? "").trim() : "";
