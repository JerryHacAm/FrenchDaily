import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
}

// Admin client: full database access, bypasses row-level security.
// Use only in server code, and only when the user's own access is not enough.
let adminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (SUPABASE_URL === "" || SUPABASE_SERVICE_ROLE_KEY === "") {
    throw new Error("Supabase admin is not configured. Fill in .env (see .env.example).");
  }
  adminClient ??= createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export type SupabaseStatus =
  | { state: "not-configured" }
  | { state: "ok" }
  | { state: "error"; message: string };

// Checks that the Supabase project answers, without needing any tables yet.
export async function checkSupabase(): Promise<SupabaseStatus> {
  if (!isSupabaseConfigured()) return { state: "not-configured" };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      cache: "no-store",
    });
    if (res.ok) return { state: "ok" };
    return { state: "error", message: `Supabase answered with status ${res.status}` };
  } catch (err) {
    return { state: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
