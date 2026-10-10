import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/config";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
}

/**
 * Client with the signed-in user's session (from cookies). Row level security
 * limits it to that user's own rows. Create a new one per request.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called while rendering a page, where cookies can't be set.
          // src/proxy.ts refreshes the session on every request instead.
        }
      },
    },
  });
}

// Admin client: full database access, bypasses row-level security.
// Server only, and only for the /stats page.
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

// Checks that the Supabase project answers, without needing any tables.
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
