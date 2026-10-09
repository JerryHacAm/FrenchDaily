"use client";

import { useState } from "react";
import type { WordBankEntry } from "@/lib/learning/usage";
import { cx } from "./ui";

// Recent words stay on screen so the learner can reuse them (Jerry's idea).
// French only; tap to see the meaning (so it's recall, not copying).
// Quiet words (learned, never used on your own) are marked with a dot.

export function WordBank({ words }: { words: WordBankEntry[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  if (words.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">Your recent words</div>
      <p className="text-xs text-muted">Use one in your sentence! Tap to see the meaning.</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {words.map((w) => {
          const shown = open.has(w.id);
          return (
            <li key={w.id}>
              <button
                type="button"
                onClick={() =>
                  setOpen((s) => {
                    const next = new Set(s);
                    if (next.has(w.id)) next.delete(w.id);
                    else next.add(w.id);
                    return next;
                  })
                }
                className={cx(
                  "inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-sm transition",
                  w.quiet ? "border-warn/40 bg-warn-soft" : "border-line bg-surface-2",
                )}
                title={w.quiet ? "Quiet word: you haven't used it on your own yet" : undefined}
              >
                {w.quiet && <span aria-label="quiet word" className="h-1.5 w-1.5 rounded-full bg-warn" />}
                <span className="fr text-sm">{w.french}</span>
                {shown && <span className="text-xs text-muted">· {w.english}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
