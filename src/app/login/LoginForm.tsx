"use client";

import { useActionState, useState } from "react";
import { Button, cx, Notice } from "@/components/ui";
import { signInAction, signUpAction } from "./actions";

// Two clearly different screens: "Sign in" (I have an account) and
// "Create account" (first time, invite-only), switched with tabs.

const MODES = {
  in: {
    tab: "Sign in",
    title: "Welcome back",
    intro: "Sign in with the email and password you chose when you created your account.",
    submit: "Sign in",
    pending: "Signing in…",
  },
  up: {
    tab: "Create account",
    title: "Create your account",
    intro: "First time here? This app is invite-only: use the email Jerry added for you, and choose a password.",
    submit: "Create my account",
    pending: "Creating your account…",
  },
} as const;

const inputClass = "mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2.5";

export function LoginForm({ initialMode = "in" }: { initialMode?: "in" | "up" }) {
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [inResult, signIn, signingIn] = useActionState(signInAction, null);
  const [upResult, signUp, signingUp] = useActionState(signUpAction, null);
  const result = mode === "in" ? inResult : upResult;
  const pending = signingIn || signingUp;
  const m = MODES[mode];

  return (
    <div>
      <div role="tablist" aria-label="Sign in or create an account" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(["in", "up"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            onClick={() => setMode(k)}
            className={cx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              mode === k ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {MODES[k].tab}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold">{m.title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted">{m.intro}</p>

      {/* key: a fresh form per mode, so typed values and messages don't carry over */}
      <form key={mode} action={mode === "in" ? signIn : signUp} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{mode === "in" ? "Password" : "Choose a password"}</span>
          {mode === "up" && <span className="block text-xs text-muted">At least 8 characters.</span>}
          <input
            name="password"
            type="password"
            required
            minLength={mode === "up" ? 8 : undefined}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className={inputClass}
          />
        </label>
        {mode === "up" && (
          <label className="block">
            <span className="text-sm font-medium">Type the password again</span>
            <input name="password2" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </label>
        )}
        {result?.error && <Notice tone="bad">{result.error}</Notice>}
        {result?.message && <Notice tone="good">{result.message}</Notice>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? m.pending : m.submit}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {mode === "in" ? "First time here? " : "Already have an account? "}
        <button type="button" className="text-accent" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Create an account" : "Sign in instead"}
        </button>
      </p>
    </div>
  );
}
