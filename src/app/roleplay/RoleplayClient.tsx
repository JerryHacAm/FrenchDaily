"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { closeRoleplayAction, finishRoleplayAction, sendRoleplayAction, startRoleplayAction } from "@/app/actions";
import { Speak } from "@/components/Speak";
import { Badge, Button, Card, cx, Notice } from "@/components/ui";
import type { Result } from "@/lib/services/common";
import type { RoleplayView } from "@/lib/services/roleplay";

// Weekly role-play (ROADMAP D1): a short chat. No corrections during the
// chat (so it flows); feedback comes at the end.

export function RoleplayClient({ initial, ruleTitles }: { initial: RoleplayView; ruleTitles: Record<string, string> }) {
  const [view, setView] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Block body on purpose: newer browsers return a Promise from scrollIntoView,
    // and an effect may only return a clean-up function.
    void bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [view.session?.messages.length]);

  function run(action: () => Promise<Result<RoleplayView>>, after?: () => void) {
    setError(null);
    start(async () => {
      const r = await action();
      if (r.data) setView(r.data);
      if (!r.ok) setError(r.error);
      else after?.();
    });
  }

  const session = view.session;

  if (!session) {
    return (
      <div className="space-y-3">
        {view.doneThisWeek && <Notice tone="good">You did this week&apos;s role-play. Bravo! You can do another one any time.</Notice>}
        {error && <Notice tone="bad">{error}</Notice>}
        <div className="grid gap-3 sm:grid-cols-2">
          {view.scenarios.map((s) => (
            <Card key={s.id} className={cx("flex flex-col gap-2", s.locked && "opacity-60")}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{s.title}</h2>
                <Badge tone={s.locked ? "neutral" : "accent"}>{s.locked ? `Level ${s.min_level}+` : s.title_fr}</Badge>
              </div>
              <p className="text-sm text-muted">{s.intro}</p>
              <Button
                variant="secondary"
                className="mt-auto"
                disabled={pending || s.locked}
                onClick={() => run(() => startRoleplayAction(s.id))}
              >
                Start
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const turnsLeft = view.maxTurns - view.learnerTurns;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{view.scenario?.title}</h2>
          {view.scenario && <p className="text-sm text-muted">{view.scenario.intro}</p>}
          {session.weekWords.length > 0 && (
            <p className="text-xs text-muted">Try to use: {session.weekWords.join(", ")}</p>
          )}
        </div>
        <Badge tone={session.finished ? "good" : "accent"}>
          {session.finished ? "Finished" : `${turnsLeft} message${turnsLeft === 1 ? "" : "s"} left`}
        </Badge>
      </div>

      <Card className="space-y-3">
        {session.messages.map((m, i) => (
          <div key={i} className={cx("flex", m.from === "learner" ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-3 py-2",
                m.from === "learner" ? "bg-accent text-accent-fg" : "bg-surface-2",
              )}
            >
              <p className="fr">{m.fr}</p>
              {m.from === "ai" && (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <Speak text={m.fr} label="" />
                  {m.en &&
                    (shown.has(i) ? (
                      <span className="text-sm text-muted">{m.en}</span>
                    ) : (
                      <button type="button" className="text-xs text-accent" onClick={() => setShown(new Set(shown).add(i))}>
                        Translate
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </Card>

      {error && <Notice tone="bad">{error}</Notice>}

      {!session.finished ? (
        <Card className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && text.trim() && !pending) {
                e.preventDefault();
                run(() => sendRoleplayAction(text), () => setText(""));
              }
            }}
            rows={2}
            maxLength={300}
            lang="fr"
            spellCheck={false}
            placeholder="Réponds en français… (Enter to send)"
            className="fr block w-full rounded-xl border border-line bg-surface px-3 py-2.5"
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={pending || !text.trim()} onClick={() => run(() => sendRoleplayAction(text), () => setText(""))}>
              {pending ? "…" : "Send"}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(() => finishRoleplayAction())}>
              Finish and get feedback
            </Button>
          </div>
          <p className="text-xs text-muted">Each message uses one AI check. No corrections during the chat: they come at the end.</p>
        </Card>
      ) : (
        session.summary && (
          <Card className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wide text-accent">Feedback</div>
            <p>{session.summary.overall}</p>
            <Notice tone="good">👏 {session.summary.praise}</Notice>
            {session.summary.corrections.length > 0 && (
              <ul className="space-y-2">
                {session.summary.corrections.map((c, i) => (
                  <li key={i} className="rounded-lg border border-line p-3 text-sm">
                    <span className="text-bad line-through">{c.original}</span> → <span className="font-medium text-good">{c.fix}</span>
                    <span className="ml-2 text-xs text-muted">{ruleTitles[c.tag] ?? c.tag}</span>
                    <p className="mt-1">{c.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
            {session.summary.wordsUsed.length > 0 && (
              <p className="text-sm text-muted">Words you used: {session.summary.wordsUsed.join(", ")}</p>
            )}
            <Button variant="secondary" disabled={pending} onClick={() => run(() => closeRoleplayAction())}>
              Close
            </Button>
          </Card>
        )
      )}
    </div>
  );
}
