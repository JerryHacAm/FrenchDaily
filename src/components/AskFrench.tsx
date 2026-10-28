"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { askFrenchAction } from "@/app/actions";
import type { AskMessage } from "@/lib/ai/types";
import { speakFrench } from "./Speak";
import { cx } from "./ui";

// "Ask about French": a round button at the bottom right of every page that
// opens a small chat. The chat lives only in this tab (it survives moving
// between pages, not a reload). Each question uses one AI check.

const MAX_CHARS = 500;

const SUGGESTIONS = ["What is “apple” in French?", "How do I say 25?", "When do I use “tu” or “vous”?"];

/** **bold** = French (tap to hear). Lines starting with "- " become a list. */
function renderAnswer(text: string): ReactNode {
  const inline = (line: string) =>
    line.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? (
        <button
          key={i}
          type="button"
          lang="fr"
          title="Tap to hear"
          onClick={() => speakFrench(part)}
          className="fr inline font-semibold text-accent underline decoration-dotted underline-offset-2"
        >
          {part}
        </button>
      ) : (
        part
      ),
    );
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-•]\s/.test(l))) {
      return (
        <ul key={i} className="list-disc space-y-0.5 pl-5">
          {lines.map((l, j) => (
            <li key={j}>{inline(l.replace(/^\s*[-•]\s/, ""))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i}>
        {lines.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {inline(l)}
          </span>
        ))}
      </p>
    );
  });
}

export function AskFrench() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checksLeft, setChecksLeft] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Block body on purpose: newer browsers return a Promise from scrollIntoView.
    void bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending, open]);

  useEffect(() => {
    // Not on phones: the keyboard would pop up over the chat.
    if (open && window.matchMedia("(pointer: fine)").matches) input.current?.focus();
  }, [open]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    const history = messages;
    setError(null);
    setMessages([...history, { from: "learner", text: q }]);
    setText("");
    start(async () => {
      const r = await askFrenchAction(q, history);
      if (r.ok) {
        setMessages((m) => [...m, { from: "ai", text: r.data.answer }]);
        setChecksLeft(r.data.checksLeft);
      } else {
        // Put the question back so the learner can try again.
        setMessages(history);
        setText(q);
        setError(r.error);
      }
    });
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Ask about French"
          className="fixed right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))", height: "min(34rem, calc(100dvh - 7.5rem))" }}
        >
          <div className="flex items-center justify-between gap-2 bg-accent px-4 py-3 text-accent-fg">
            <div>
              <div className="font-semibold">Ask about French</div>
              <div className="text-xs opacity-80">Words, numbers, grammar, anything French</div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  disabled={pending}
                  className="rounded-lg px-2 py-1 text-xs hover:bg-white/15 disabled:opacity-50"
                >
                  New chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-white/15"
              >
                −
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted">
                  Bonjour ! Ask me anything about French: what a word means, how to say a number, or how a structure works.
                </p>
                <div className="flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      disabled={pending}
                      className="rounded-full border border-line px-3 py-1.5 text-left hover:bg-surface-2"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cx("flex", m.from === "learner" ? "justify-end" : "justify-start")}>
                <div
                  className={cx(
                    "max-w-[88%] space-y-2 rounded-2xl px-3 py-2 leading-relaxed",
                    m.from === "learner" ? "whitespace-pre-wrap bg-accent text-accent-fg" : "bg-surface-2",
                  )}
                >
                  {m.from === "learner" ? m.text : renderAnswer(m.text)}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-surface-2 px-3 py-2 text-muted">…</div>
              </div>
            )}
            {error && <div className="rounded-xl bg-bad-soft px-3 py-2 text-bad">{error}</div>}
            <div ref={bottom} />
          </div>

          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(text);
                  }
                }}
                rows={1}
                maxLength={MAX_CHARS}
                placeholder="Ask a question… (Enter to send)"
                className="block max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2.5"
              />
              <button
                type="submit"
                disabled={pending || !text.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg hover:opacity-90 disabled:opacity-50"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Each question uses one AI check{checksLeft !== null && ` · ${checksLeft} left today`}.
            </p>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close Ask about French" : "Ask about French"}
        aria-expanded={open}
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition hover:scale-105"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {open ? (
          <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4.6 21.5l3.8-1.9c1.1.3 2.3.5 3.6.5 5.5 0 10-3.9 10-8.7S17.5 3 12 3Zm-4 10a1.3 1.3 0 1 1 0-2.6A1.3 1.3 0 0 1 8 13Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" />
          </svg>
        )}
      </button>
    </>
  );
}
