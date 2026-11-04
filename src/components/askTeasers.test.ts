import { describe, expect, it } from "vitest";
import { ASK_TEASERS, pickTeaser } from "./askTeasers";

// Long enough for a joke, short enough to fit next to the button on a phone.
const MAX_TEASER_CHARS = 70;

describe("chat teasers", () => {
  it("are short, unique and not empty", () => {
    expect(ASK_TEASERS.length).toBeGreaterThan(1);
    expect(new Set(ASK_TEASERS).size).toBe(ASK_TEASERS.length);
    for (const t of ASK_TEASERS) {
      expect(t.trim().length).toBeGreaterThan(0);
      expect(t.length, t).toBeLessThanOrEqual(MAX_TEASER_CHARS);
    }
  });

  it("picks every teaser, never outside the list", () => {
    expect(pickTeaser(() => 0)).toBe(ASK_TEASERS[0]);
    expect(pickTeaser(() => 0.999999)).toBe(ASK_TEASERS[ASK_TEASERS.length - 1]);
  });
});
