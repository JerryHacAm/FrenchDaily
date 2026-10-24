// Invite-only access for the online app (STORAGE=supabase). Pure, so it is tested.

/** The invite list: emails, and whether invite-only is on at all. */
export type InviteList = { emails: string[]; inviteOnly: boolean };

/**
 * Joins ALLOWED_EMAILS with the emails in the `invites` table. `tableEmails`
 * is null when the table couldn't be read: then invite-only stays on (only
 * ALLOWED_EMAILS and admins get in), so a database hiccup never opens the
 * app to everyone. Both empty = invite-only is off: anyone may sign up.
 */
export function mergeInvites(envEmails: readonly string[], tableEmails: readonly string[] | null): InviteList {
  const fromTable = (tableEmails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean);
  const emails = [...new Set([...envEmails, ...fromTable])];
  return { emails, inviteOnly: tableEmails === null || emails.length > 0 };
}

/**
 * True if this email may use the app. `admins` = ADMIN_EMAILS (always allowed).
 */
export function isEmailAllowed(email: string | null, invites: InviteList, admins: readonly string[]): boolean {
  if (!invites.inviteOnly) return true;
  const e = email?.trim().toLowerCase();
  if (!e) return false;
  return invites.emails.includes(e) || admins.includes(e);
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
