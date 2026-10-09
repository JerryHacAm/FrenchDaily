import "server-only";
import { connection } from "next/server";
import { ADMIN_EMAILS, DATA_DIR, STORAGE } from "@/lib/config";
import { FileStore } from "@/lib/store/file";
import { SupabaseStore } from "@/lib/store/supabase";
import type { Store } from "@/lib/store/types";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server";

// Who is using the app, and where their data lives. Every page and every
// server action starts here, and always works on the signed-in user's id.

export type AppUser = { id: string; email: string | null; isAdmin: boolean };

/** In STORAGE=file mode there is no login: one local learner. */
export const LOCAL_USER: AppUser = { id: "local-user", email: null, isAdmin: true };

let fileStore: FileStore | null = null;

export type RequestContext = { user: AppUser | null; store: Store; loginRequired: boolean };

export async function getContext(): Promise<RequestContext> {
  // Pages must render per request (user data, today's date), never at build time.
  await connection();
  if (STORAGE === "file") {
    fileStore ??= new FileStore(DATA_DIR);
    return { user: LOCAL_USER, store: fileStore, loginRequired: false };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const store = new SupabaseStore(supabase, getSupabaseAdmin);
  if (!data.user) return { user: null, store, loginRequired: true };
  const email = data.user.email?.toLowerCase() ?? null;
  return {
    user: { id: data.user.id, email, isAdmin: email !== null && ADMIN_EMAILS.includes(email) },
    store,
    loginRequired: true,
  };
}

export class NotSignedInError extends Error {
  constructor() {
    super("Please sign in again.");
  }
}

/** For server actions: the signed-in user, or an error. */
export async function requireUser(): Promise<{ user: AppUser; store: Store }> {
  const ctx = await getContext();
  if (!ctx.user) throw new NotSignedInError();
  return { user: ctx.user, store: ctx.store };
}
