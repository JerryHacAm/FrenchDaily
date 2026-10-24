import "server-only";
import { mergeInvites, type InviteList } from "@/lib/access";
import { ALLOWED_EMAILS, STORAGE } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// The invite list = ALLOWED_EMAILS + the `invites` table in Supabase
// (supabase/migrations/20261024000000_invites.sql). Jerry adds friends in the
// table, so no redeploy is needed. Kept for a short time so every page
// doesn't ask the database again.

const CACHE_MS = 30_000;
let cached: { list: InviteList; at: number } | null = null;

export async function getInviteList(): Promise<InviteList> {
  if (STORAGE !== "supabase") return mergeInvites(ALLOWED_EMAILS, []);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.list;
  let tableEmails: string[] | null = null;
  try {
    const { data, error } = await getSupabaseAdmin().from("invites").select("email");
    if (error) throw new Error(error.message);
    tableEmails = (data ?? []).map((row) => String(row.email));
  } catch (err) {
    console.error("Could not read the invites table:", err instanceof Error ? err.message : err);
  }
  const list = mergeInvites(ALLOWED_EMAILS, tableEmails);
  // Don't keep a failed read: try the table again on the next request.
  cached = tableEmails === null ? null : { list, at: Date.now() };
  return list;
}
