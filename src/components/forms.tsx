"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { dismissNoticesAction, saveProfileAction } from "@/app/actions";
import { Button, Notice } from "./ui";

/** The browser's time zone, so "today" is the learner's own day. */
export function useTimezone(): string {
  const [tz, setTz] = useState("");
  useEffect(() => {
    // Read once after mounting (the server can't know the browser's time zone).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
  }, []);
  return tz;
}

const LEVELS = [
  { value: 1, label: "Level 1", hint: "I'm starting from zero, or I know a few words." },
  { value: 2, label: "Level 2", hint: "I can write simple sentences in the present." },
  { value: 3, label: "Level 3", hint: "I can talk about my day and the past." },
  { value: 4, label: "Level 4", hint: "I can tell stories and compare things." },
  { value: 5, label: "Level 5", hint: "I'm comfortable; I want nuance (si, subjunctive…)." },
];

export function ProfileForm({
  initialName = "",
  initialLevel = 1,
  submitLabel,
}: {
  initialName?: string;
  initialLevel?: number;
  submitLabel: string;
}) {
  const router = useRouter();
  const tz = useTimezone();
  const [result, action, pending] = useActionState(saveProfileAction, null);
  useEffect(() => {
    if (result?.ok) router.refresh();
  }, [result, router]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="timezone" value={tz} />
      <label className="block">
        <span className="text-sm font-medium">Your first name</span>
        <input
          name="name"
          defaultValue={initialName}
          required
          maxLength={40}
          autoComplete="given-name"
          className="mt-1 block w-full rounded-xl border border-line bg-surface px-3 py-2.5"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Where are you starting?</legend>
        <p className="text-sm text-muted">Pick the closest. The app moves you up or down by itself later.</p>
        <div className="mt-2 grid gap-2">
          {LEVELS.map((l) => (
            <label key={l.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
              <input type="radio" name="level" value={l.value} defaultChecked={l.value === initialLevel} className="mt-1" />
              <span>
                <span className="font-medium">{l.label}</span>
                <span className="block text-sm text-muted">{l.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {result && !result.ok && <Notice tone="bad">{result.error}</Notice>}
      {result?.ok && result.message && <Notice tone="good">{result.message}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

export function NoticeList({ notices }: { notices: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (notices.length === 0) return null;
  return (
    <div className="space-y-2">
      {notices.map((n, i) => (
        <Notice key={i} tone="accent">
          {n}
        </Notice>
      ))}
      <button
        className="text-sm text-muted underline-offset-2 hover:underline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await dismissNoticesAction();
            router.refresh();
          })
        }
      >
        Got it
      </button>
    </div>
  );
}
