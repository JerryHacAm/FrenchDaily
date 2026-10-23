"use client";

import { useState, useTransition } from "react";
import { reportAction } from "@/app/actions";
import type { Feedback } from "@/lib/learning/state";
import { Highlight } from "./Highlight";
import { Speak } from "./Speak";
import { Badge, cx } from "./ui";

// Small, focused feedback (README 3.4): corrected sentence, max 2 mistakes
// with a one-line explanation, "More detail" on tap, 2 example sentences.
// mode "hints": the fix step, so it shows WHERE and a hint, never the answer.

export function FeedbackCard({
  sentence,
  feedback,
  sentenceId,
  fixAttempt,
  mode,
}: {
  sentence: string;
  feedback: Feedback;
  sentenceId?: string | null;
  /** The learner's fix try, if it was still wrong. */
  fixAttempt?: string | null;
  mode: "hints" | "full";
}) {
  const correct = feedback.is_correct;
  return (
    <div className={cx("space-y-3 rounded-xl border p-4", correct ? "border-good/30 bg-good-soft/50" : "border-line bg-surface-2/60")}>
      {correct ? (
        <div>
          <Badge tone="good">✓ Correct</Badge>
          <p className="fr mt-2">{sentence}</p>
          {feedback.encouragement && <p className="mt-1 text-sm text-muted">{feedback.encouragement}</p>}
        </div>
      ) : mode === "hints" ? (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-warn">Almost! Can you fix it?</div>
          <p className="fr mt-2">
            <Highlight text={sentence} parts={feedback.mistakes.map((m) => m.original)} tone="bad" />
          </p>
          <ul className="mt-3 space-y-2">
            {feedback.mistakes.map((m, i) => (
              <li key={i} className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
                <span aria-hidden>💡 </span>
                {m.hint || m.short_explanation}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Corrected</div>
          <p className="fr mt-1">
            <Highlight text={feedback.corrected_sentence} parts={feedback.mistakes.map((m) => m.fix)} tone="good" />
            <Speak text={feedback.corrected_sentence} className="ml-1 align-middle" />
          </p>
          <p className="mt-1 text-sm text-muted">
            You wrote: <Highlight text={sentence} parts={feedback.mistakes.map((m) => m.original)} tone="bad" />
          </p>
          {fixAttempt && (
            <p className="mt-1 text-sm text-muted">
              Your fix: <span className="fr">{fixAttempt}</span>
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {feedback.mistakes.map((m, i) => (
              <li key={i} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-bad line-through">{m.original}</span>
                  <span aria-hidden>→</span>
                  <span className="font-medium text-good">{m.fix}</span>
                  {m.severity === "minor" && <Badge>small</Badge>}
                </div>
                <p className="mt-1">{m.short_explanation}</p>
                {m.detail && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-accent">More detail</summary>
                    <p className="mt-1 text-muted">{m.detail}</p>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === "full" && feedback.example_sentences.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Learn from these</div>
          <ul className="mt-1 space-y-1">
            {feedback.example_sentences.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="fr">{e.french}</span>
                <Speak text={e.french} label="" className="ml-1 align-middle" />
                <span className="block text-muted">{e.english}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {mode === "full" && <ReportButton sentenceId={sentenceId ?? null} sentence={sentence} feedback={feedback} />}
    </div>
  );
}

function ReportButton({ sentenceId, sentence, feedback }: { sentenceId: string | null; sentence: string; feedback: Feedback }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (sent) return <p className="text-xs text-good">{sent}</p>;
  if (!open) {
    return (
      <button type="button" className="text-xs text-muted underline-offset-2 hover:underline" onClick={() => setOpen(true)}>
        Something wrong with this feedback? Report it
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="What looks wrong? (optional)"
        className="block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        className="text-sm font-medium text-accent"
        onClick={() =>
          start(async () => {
            const r = await reportAction(sentenceId, note, { sentence, feedback });
            setSent(r.ok ? (r.message ?? "Sent.") : r.error);
          })
        }
      >
        {pending ? "Sending…" : "Send report"}
      </button>
    </div>
  );
}
