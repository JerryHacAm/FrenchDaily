"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  showAnswerAction,
  skipItemAction,
  startPracticeAction,
  startWritingAction,
  submitFixAction,
  submitRetypeAction,
  submitSentenceAction,
} from "@/app/actions";
import { FeedbackCard } from "@/components/FeedbackCard";
import { useTimezone } from "@/components/forms";
import { Speak } from "@/components/Speak";
import { Badge, Button, ButtonLink, Card, cx, Notice, ProgressBar } from "@/components/ui";
import { WordBank } from "@/components/WordBank";
import type { Result } from "@/lib/services/common";
import type { ItemView, PracticeView } from "@/lib/learning/view";

// The practice screen: read → write 3 items → (fix → retype) → next word.
// All decisions happen on the server (src/lib/services/practice.ts); this
// component only shows the current step and sends what the learner types.

const REASON: Record<string, { label: string; tone: "accent" | "good" | "warn" | "neutral" | "bad" }> = {
  new: { label: "New word", tone: "accent" },
  review: { label: "Review", tone: "good" },
  quiet: { label: "Bring it back", tone: "warn" },
  weak: { label: "Practice again", tone: "warn" },
  focus: { label: "Focus practice", tone: "accent" },
  extra: { label: "Extra", tone: "neutral" },
};

const GENDER_BADGE: Record<"m" | "f" | "m/f", { label: string; tone: "accent" | "bad" | "neutral" }> = {
  m: { label: "masculine (le / un)", tone: "accent" },
  f: { label: "feminine (la / une)", tone: "bad" },
  "m/f": { label: "man or woman (both forms)", tone: "neutral" },
};

export function PracticeClient({
  initial,
  focusTag,
  testMode,
}: {
  initial: PracticeView;
  focusTag: string | null;
  testMode: boolean;
}) {
  const [view, setView] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const tz = useTimezone();

  function run(action: () => Promise<Result<PracticeView>>) {
    setError(null);
    setMessage(null);
    start(async () => {
      const r = await action();
      if (r.data) setView(r.data);
      if (r.ok) setMessage(r.message ?? null);
      else setError(r.error);
    });
  }

  const session = view.session;
  const status = (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted tabular-nums">
        <span>
          Today: {view.today.completed} / {view.today.goal} words · 🔥 {view.streak}
        </span>
        <span>{view.today.checksLeft} AI checks left</span>
      </div>
      <ProgressBar value={view.today.completed} max={view.today.goal} label="Words completed today" />
    </div>
  );

  if (!session || session.finished || !session.word) {
    const finished = session?.finished;
    return (
      <div>
        {status}
        {message && <Notice tone="good" className="mb-3">{message}</Notice>}
        {error && <Notice tone="bad" className="mb-3">{error}</Notice>}
        <Card className="text-center">
          {finished ? (
            <>
              <div className="text-4xl" aria-hidden>🎉</div>
              <h2 className="mt-2 text-xl font-semibold">Batch done!</h2>
              <p className="mt-1 text-muted">You practised: {session.completedInSession.join(", ")}.</p>
              {view.today.completed >= view.today.goal && <p className="mt-1 text-good">Today&apos;s goal is reached. Your streak is safe.</p>}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{focusTag ? "Focus practice" : "Ready for today's words?"}</h2>
              <p className="mt-1 text-muted">
                For each word: read a short text, then write 2 sentences and 1 question.
              </p>
            </>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(!finished || testMode) && (
              <Button disabled={pending || !tz} onClick={() => run(() => startPracticeAction(tz, focusTag))}>
                {pending ? "Choosing words…" : finished ? "Give me more words" : "Start"}
              </Button>
            )}
            <ButtonLink href="/" variant="secondary">
              Back to Today
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const word = session.word;
  const reason = REASON[word.reason] ?? REASON.new;

  return (
    <div>
      {status}
      {session.focusTitle && (
        <Notice tone="accent" className="mb-3">
          Focus: <strong>{session.focusTitle}</strong>. Pay extra attention to it in your sentences.
        </Notice>
      )}
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          Word {session.wordIndex + 1} of {session.wordCount}
        </span>
        <Badge tone={reason.tone}>{reason.label}</Badge>
      </div>

      {word.stage === "read" ? (
        <>
          {message && session.wordIndex > 0 && (
            <Notice tone="good" className="mb-3">
              {message} Word {session.wordIndex} done ✓
            </Notice>
          )}
          {error && <Notice tone="bad" className="mb-3">{error}</Notice>}
          <ReadStep word={word} pending={pending} onDone={() => run(() => startWritingAction())} />
        </>
      ) : (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <span className="fr text-xl font-semibold">{word.display}</span>
              <span className="ml-2 text-muted">{word.english}</span>
            </div>
            <Speak text={word.display} />
          </Card>

          <ItemDots items={session.items} index={session.itemIndex} />

          {session.items.map((item, i) =>
            item.stage === "accepted" && item.feedback && item.sentence ? (
              <details key={i} className="rounded-xl border border-line bg-surface px-4 py-2">
                <summary className="cursor-pointer text-sm">
                  <span className="text-good">✓</span> <span className="fr">{item.feedback.corrected_sentence}</span>
                </summary>
                <div className="py-2">
                  <FeedbackCard sentence={item.sentence} feedback={item.feedback} sentenceId={item.sentenceId} mode="full" />
                </div>
              </details>
            ) : null,
          )}

          {message && <Notice tone="good">{message}</Notice>}

          <ItemStep
            key={`${session.id}-${word.id}-${session.itemIndex}-${session.items[session.itemIndex].stage}`}
            item={session.items[session.itemIndex]}
            index={session.itemIndex}
            minWords={session.minWords}
            pending={pending}
            error={error}
            onSubmit={(text) => run(() => submitSentenceAction(text))}
            onFix={(text) => run(() => submitFixAction(text))}
            onShowAnswer={() => run(() => showAnswerAction())}
            onRetype={(text) => run(() => submitRetypeAction(text))}
            onSkip={() => run(() => skipItemAction())}
          />

          <WordBank words={view.wordBank} />

          <p className="text-center text-xs text-muted">
            Your progress is saved after every sentence. <Link href="/" className="underline">Stop for now</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function ReadStep({
  word,
  pending,
  onDone,
}: {
  word: NonNullable<NonNullable<PracticeView["session"]>["word"]>;
  pending: boolean;
  onDone: () => void;
}) {
  const [showEn, setShowEn] = useState(false);
  return (
    <div className="space-y-4">
      <Card className="text-center">
        <div className="fr text-4xl font-semibold tracking-tight">{word.display}</div>
        <div className="mt-1 text-lg text-muted">{word.english}</div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Badge>{word.pos}</Badge>
          {word.gender && <Badge tone={GENDER_BADGE[word.gender].tone}>{GENDER_BADGE[word.gender].label}</Badge>}
        </div>
        <Speak text={word.display} className="mt-2" />
        <div className="mt-4 border-t border-line pt-3">
          <p className="fr">
            {word.example}
            <Speak text={word.example} label="" className="ml-1 align-middle" />
          </p>
          <p className="text-sm text-muted">{word.exampleEn}</p>
        </div>
        {(word.note || word.nb.length > 0) && (
          <div className="mt-3 space-y-2 text-left text-sm">
            {word.note && (
              <p className="rounded-lg bg-surface-2 px-3 py-2">
                <span aria-hidden>💡 </span>
                {word.note}
              </p>
            )}
            {word.nb.map((line, i) => (
              <p key={i} className="rounded-lg bg-warn-soft px-3 py-2 text-warn">
                <span className="font-medium">N.B.</span> {line}
              </p>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Read first</h2>
          <Speak text={word.miniText.fr} label="Listen" />
        </div>
        <p className="fr mt-2">{word.miniText.fr}</p>
        {showEn ? (
          <p className="mt-2 text-sm text-muted">{word.miniText.en}</p>
        ) : (
          <button type="button" onClick={() => setShowEn(true)} className="mt-2 text-sm text-accent">
            Show English
          </button>
        )}
        <p className="mt-3 text-sm text-muted">Notice how &ldquo;{word.display}&rdquo; is used. You&apos;ll write your own sentences next.</p>
      </Card>

      <Button className="w-full" disabled={pending} onClick={onDone}>
        {pending ? "…" : "I've read it: start writing"}
      </Button>
    </div>
  );
}

function ItemDots({ items, index }: { items: ItemView[]; index: number }) {
  return (
    <ol className="flex gap-2" aria-label="Sentences for this word">
      {items.map((it, i) => (
        <li
          key={i}
          className={cx(
            "flex-1 rounded-full py-1 text-center text-xs font-medium",
            it.stage === "accepted" ? "bg-good-soft text-good" : i === index ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted",
          )}
        >
          {it.type === "question" ? "Question" : `Sentence ${i + 1}`}
        </li>
      ))}
    </ol>
  );
}

function ItemStep({
  item,
  index,
  minWords,
  pending,
  error,
  onSubmit,
  onFix,
  onShowAnswer,
  onRetype,
  onSkip,
}: {
  item: ItemView;
  index: number;
  minWords: number;
  pending: boolean;
  error: string | null;
  onSubmit: (text: string) => void;
  onFix: (text: string) => void;
  onShowAnswer: () => void;
  onRetype: (text: string) => void;
  onSkip: () => void;
}) {
  const [text, setText] = useState(item.stage === "fix" ? (item.sentence ?? "") : "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = () => {
    if (!text.trim() || pending) return;
    if (item.stage === "write") onSubmit(text);
    else if (item.stage === "fix") onFix(text);
    else if (item.stage === "retype") onRetype(text);
  };

  const title = item.type === "question" ? "Write a question" : `Write sentence ${index + 1}`;
  const structureNote = item.stage === "write" && item.feedback && !item.feedback.structure_ok ? item.feedback.structure_note : null;

  return (
    <Card className="space-y-3">
      {item.stage === "write" && (
        <>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">
              Use the word, a verb{item.type === "statement" ? ", and a place, time or reason" : ""}. At least {minWords} words.
            </p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3 text-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Structure</div>
            <div className="mt-0.5 font-medium">{item.pattern}</div>
            {item.example && (
              <div className="mt-1 text-muted">
                e.g. <span className="fr italic">{item.example}</span>
                {item.exampleEn && <span className="block text-xs">{item.exampleEn}</span>}
              </div>
            )}
          </div>
          {structureNote && <Notice tone="warn">{structureNote}</Notice>}
        </>
      )}

      {item.stage === "fix" && item.feedback && item.sentence && (
        <>
          <FeedbackCard sentence={item.sentence} feedback={item.feedback} mode="hints" />
          <p className="text-sm font-medium">Fix your sentence below:</p>
        </>
      )}

      {item.stage === "retype" && item.feedback && item.sentence && (
        <>
          <FeedbackCard
            sentence={item.sentence}
            feedback={item.feedback}
            sentenceId={item.sentenceId}
            fixAttempt={item.fixAttempt}
            mode="full"
          />
          <p className="text-sm font-medium">Now type the corrected sentence yourself (it helps you remember):</p>
        </>
      )}

      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
        }}
        rows={3}
        maxLength={300}
        lang="fr"
        spellCheck={false}
        autoCapitalize="sentences"
        placeholder={item.stage === "retype" ? "Type the corrected sentence…" : "Écris en français…"}
        className="fr block w-full rounded-xl border border-line bg-surface px-3 py-2.5"
      />
      {error && <Notice tone="bad">{error}</Notice>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={submit} disabled={pending || !text.trim()}>
          {pending
            ? "Checking…"
            : item.stage === "write"
              ? "Check"
              : item.stage === "fix"
                ? "Check my fix"
                : "Done"}
        </Button>
        {item.stage === "fix" && (
          <Button variant="ghost" onClick={onShowAnswer} disabled={pending}>
            Show me the answer
          </Button>
        )}
        {item.stage === "retype" && item.canSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={pending}>
            Skip for now
          </Button>
        )}
      </div>
      <p className="text-xs text-muted">Tip: Ctrl + Enter to send.</p>
    </Card>
  );
}
