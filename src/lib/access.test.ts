import { describe, expect, it } from "vitest";
import { canUseBypass, isEmailAllowed } from "./access";

describe("isEmailAllowed (invite-only list)", () => {
  const allowed = ["friend@example.com"];
  const admins = ["jerry@example.com"];

  it("lets in invited emails and admins, ignoring case and spaces", () => {
    expect(isEmailAllowed(" Friend@Example.com ", allowed, admins)).toBe(true);
    expect(isEmailAllowed("jerry@example.com", allowed, admins)).toBe(true);
  });

  it("keeps everyone else out, including users without an email", () => {
    expect(isEmailAllowed("stranger@example.com", allowed, admins)).toBe(false);
    expect(isEmailAllowed(null, allowed, admins)).toBe(false);
  });

  it("is open to anyone when the invite list is empty", () => {
    expect(isEmailAllowed("stranger@example.com", [], admins)).toBe(true);
  });
});

describe("canUseBypass (test code)", () => {
  it("works for admins and invited emails, not for anyone else", () => {
    expect(canUseBypass(null, true, [])).toBe(true); // admin, or the local learner
    expect(canUseBypass(" Friend@Example.com ", false, ["friend@example.com"])).toBe(true);
    expect(canUseBypass("stranger@example.com", false, ["friend@example.com"])).toBe(false);
    expect(canUseBypass("stranger@example.com", false, [])).toBe(false);
    expect(canUseBypass(null, false, ["friend@example.com"])).toBe(false);
  });
});
