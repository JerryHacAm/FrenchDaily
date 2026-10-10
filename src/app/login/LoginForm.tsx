"use client";

import { useActionState, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { signInAction, signUpAction } from "./actions";

export function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inResult, signIn, signingIn] = useActionState(signInAction, null);
  const [upResult, signUp, signingUp] = useActionState(signUpAction, null);
  const result = mode === "in" ? inResult : upResult;
  const pending = signingIn || signingUp;

  return (
    <form action={mode === "in" ? signIn : signUp} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" required autoComplete="email" className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2.5" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "up" ? 8 : undefined}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2.5"
        />
      </label>
      {result?.error && <Notice tone="bad">{result.error}</Notice>}
      {result?.message && <Notice tone="good">{result.message}</Notice>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : mode === "in" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "in" ? "No account yet? " : "Already have an account? "}
        <button type="button" className="text-accent" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Create one" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
