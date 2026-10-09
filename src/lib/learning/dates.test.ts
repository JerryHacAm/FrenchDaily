import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isValidTimeZone, localDate, weekStart } from "./dates";

describe("dates", () => {
  it("uses the learner's own time zone for 'today'", () => {
    const now = new Date("2026-10-09T20:00:00Z");
    expect(localDate("Asia/Ho_Chi_Minh", now)).toBe("2026-10-10"); // 03:00 next day
    expect(localDate("America/New_York", now)).toBe("2026-10-09");
    expect(localDate("Not/AZone", now)).toBe("2026-10-09"); // falls back to UTC
  });

  it("does calendar maths across months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-01", "2026-10-10")).toBe(9);
    expect(daysBetween("2026-10-10", "2026-10-01")).toBe(-9);
  });

  it("finds the Monday of the week", () => {
    expect(weekStart("2026-10-10")).toBe("2026-10-05"); // Saturday → Monday
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
    expect(weekStart("2026-10-11")).toBe("2026-10-05"); // Sunday belongs to the same week
  });

  it("checks time zone names", () => {
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });
});
