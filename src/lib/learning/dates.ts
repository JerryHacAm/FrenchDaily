// Dates are plain "YYYY-MM-DD" strings in the learner's own time zone
// (CLAUDE.md: a "day" uses user local time). Using strings avoids most
// time-zone bugs: we convert "now" to a local date once, then only do
// calendar maths on dates.

export function localDate(timeZone: string, now: Date): string {
  let tz = timeZone;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
  } catch {
    tz = "UTC";
  }
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * 86_400_000);
}

/** Whole days from a to b (b later → positive). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** Monday of the week that contains the date. */
export function weekStart(date: string): string {
  const day = new Date(toUtc(date)).getUTCDay(); // 0 = Sunday
  const back = (day + 6) % 7;
  return addDays(date, -back);
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
