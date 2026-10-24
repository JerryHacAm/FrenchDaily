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

/**
 * True if this user may use the test code (TEST_BYPASS_CODE): admins, and
 * emails on the invite list. With an empty invite list only admins, so a
 * stranger who signs up can't use it.
 */
export function canUseBypass(email: string | null, isAdmin: boolean, allowed: readonly string[]): boolean {
  if (isAdmin) return true;
  const e = email?.trim().toLowerCase();
  return !!e && allowed.includes(e);
}

export const NOT_INVITED =
  "This app is invite-only and this email isn't on the list. Ask Jerry to add you.";
