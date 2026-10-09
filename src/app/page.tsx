import Link from "next/link";
import { Suspense } from "react";
import { NoticeList, ProfileForm } from "@/components/forms";
import { Badge, ButtonLink, Card, Loading, Notice, PageTitle, ProgressBar, Stat } from "@/components/ui";
import { APP_MODE } from "@/lib/config";
import { appDeps } from "@/lib/deps";
import { getProfile } from "@/lib/services/account";
import { getDailyNote, getProgress } from "@/lib/services/coach";
import type { Deps } from "@/lib/services/common";
import { getPractice } from "@/lib/services/practice";
import { getRoleplay } from "@/lib/services/roleplay";

// Home ("Today"): streak, today's progress, the coach note and what to do next.
export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const app = await appDeps();
  if (!app) {
    return (
      <Card className="text-center">
        <PageTitle title="Bonjour !" subtitle="Sign in to start writing French every day." />
        <ButtonLink href="/login">Sign in</ButtonLink>
      </Card>
    );
  }
  const profile = await getProfile(app.deps);
  if (!profile.onboarded) {
    return (
      <div className="space-y-5">
        <PageTitle
          title="Bienvenue ! Welcome!"
          subtitle="Every day you get a few words. For each word you read a short text, then write 2 sentences and 1 question. The AI corrects them, kindly."
        />
        <Card>
          <ProfileForm submitLabel="Start learning" />
        </Card>
      </div>
    );
  }

  const practiceResult = await getPractice(app.deps);
  const practice = practiceResult.ok ? practiceResult.data : null;
  const [progress, roleplay] = await Promise.all([getProgress(app.deps), getRoleplay(app.deps)]);
  const done = practice ? practice.today.completed : 0;
  const goal = practice ? practice.today.goal : 0;
  const inSession = practice?.session && !practice.session.finished;

  return (
    <div className="space-y-5">
      <PageTitle title={`Bonjour, ${profile.name} !`} subtitle={`Level ${profile.level} · ${progress.stats.pace === "starting" ? "getting started" : `pace: ${progress.stats.pace}`}`} />

      {practice && <NoticeList notices={practice.notices} />}

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Today</h2>
            <p className="text-sm text-muted">
              {done >= goal ? "Goal reached. Bravo! Your streak is safe." : `${goal - done} more word${goal - done === 1 ? "" : "s"} to keep your streak.`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums">🔥 {practice?.streak ?? 0}</div>
            <div className="text-xs text-muted">day streak · {progress.stats.freezes} freeze{progress.stats.freezes === 1 ? "" : "s"}</div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={done} max={goal} label="Words completed today" />
          <div className="mt-1 text-xs text-muted tabular-nums">
            {done} / {goal} words · {practice?.today.checksLeft ?? 0} AI checks left today
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href="/practice">{inSession ? "Continue practice" : done >= goal ? (APP_MODE === "test" ? "Give me more words" : "Practise more") : "Start today's words"}</ButtonLink>
          <ButtonLink href="/review" variant="secondary">
            Review my sentences
          </ButtonLink>
        </div>
      </Card>

      <Suspense fallback={<Card><Loading label="Your coach is reading your numbers…" /></Card>}>
        <CoachCard deps={app.deps} />
      </Suspense>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Words you can really use" value={progress.stats.wordsYouCanUse} hint="used on your own" />
        <Stat label="Words seen" value={progress.stats.wordsSeen} />
        <Stat
          label="Right first time"
          value={progress.stats.accuracyLast7Days === null ? "–" : `${Math.round(progress.stats.accuracyLast7Days * 100)}%`}
          hint="last 7 days"
        />
        <Stat label="Days this week" value={progress.stats.daysPracticedThisWeek} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Weekly role-play</h2>
            <p className="text-sm text-muted">A short chat in French with this week&apos;s words. Corrections come at the end.</p>
          </div>
          {roleplay.doneThisWeek ? <Badge tone="good">Done this week ✓</Badge> : <ButtonLink href="/roleplay" variant="secondary">Start a chat</ButtonLink>}
        </div>
      </Card>

      {progress.stats.quietWords.length > 0 && (
        <Notice tone="warn">
          <strong>Quiet words:</strong> you learned {progress.stats.quietWords.join(", ")} but haven&apos;t used them on your own yet. Try one in your next sentence!
        </Notice>
      )}
    </div>
  );
}

async function CoachCard({ deps }: { deps: Deps }) {
  const note = await getDailyNote(deps);
  if (!note) return null;
  return (
    <Card className="border-accent/30 bg-accent-soft/40">
      <div className="text-xs font-medium uppercase tracking-wide text-accent">Your coach</div>
      <h2 className="mt-1 text-lg font-semibold">{note.headline}</h2>
      <p className="mt-1 text-sm">{note.message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ButtonLink href={note.focusTag ? `/practice?focus=${encodeURIComponent(note.focusTag)}` : "/practice"} variant="secondary">
          {note.actionLabel}
        </ButtonLink>
        <Link href="/progress" className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-foreground">
          See my progress →
        </Link>
      </div>
    </Card>
  );
}
