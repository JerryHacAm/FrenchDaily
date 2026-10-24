import { describe, expect, it } from "vitest";
import { canUseBypass, isEmailAllowed, mergeInvites } from "./access";

describe("isEmailAllowed (invite-only list)", () => {
  const allowed = mergeInvites(["friend@example.com"], []);
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
    expect(isEmailAllowed("stranger@example.com", mergeInvites([], []), admins)).toBe(true);
  });
});

describe("mergeInvites (ALLOWED_EMAILS + invites table)", () => {
  const admins = ["jerry@example.com"];

  it("lets in emails from the table too, ignoring case and spaces", () => {
    const list = mergeInvites(["friend@example.com"], [" New@Example.com ", "friend@example.com"]);
    expect(list.emails).toEqual(["friend@example.com", "new@example.com"]);
    expect(isEmailAllowed("new@example.com", list, admins)).toBe(true);
    expect(isEmailAllowed("stranger@example.com", list, admins)).toBe(false);
  });

  it("is invite-only with only table emails (ALLOWED_EMAILS empty)", () => {
    const list = mergeInvites([], ["new@example.com"]);
    expect(isEmailAllowed("stranger@example.com", list, admins)).toBe(false);
    expect(isEmailAllowed("new@example.com", list, admins)).toBe(true);
  });

  it("stays invite-only when the table can't be read, never open to everyone", () => {
    const list = mergeInvites([], null);
    expect(list.inviteOnly).toBe(true);
    expect(isEmailAllowed("stranger@example.com", list, admins)).toBe(false);
    expect(isEmailAllowed("jerry@example.com", list, admins)).toBe(true);
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
