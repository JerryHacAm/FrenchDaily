// Invite-only access for the online app (STORAGE=supabase). Pure, so it is tested.

/**
 * True if this email may use the app. `allowed` = ALLOWED_EMAILS,
 * `admins` = ADMIN_EMAILS (always allowed). An empty ALLOWED_EMAILS
 * means the invite list is off: anyone may sign up.
 */
export function isEmailAllowed(email: string | null, allowed: readonly string[], admins: readonly string[]): boolean {
  if (allowed.length === 0) return true;
  const e = email?.trim().toLowerCase();
  if (!e) return false;
  return allowed.includes(e) || admins.includes(e);
}

export const NOT_INVITED =
  "This app is invite-only and this email isn't on the list. Ask Jerry to add you.";
