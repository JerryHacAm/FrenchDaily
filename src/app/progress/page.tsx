import { Suspense } from "react";
import { ProfileForm } from "@/components/forms";
import { Badge, ButtonLink, Card, Loading, PageTitle, Stat } from "@/components/ui";
import { BOX_INTERVALS_DAYS } from "@/lib/learning/srs";
import { appDeps } from "@/lib/deps";
import { getProfile } from "@/lib/services/account";
import { getProgress } from "@/lib/services/coach";
import { WeeklyReportCard } from "./WeeklyReportCard";

// Progress (ROADMAP C2, C4, C7): the numbers the coach uses, shown to the learner.
export default function ProgressPage() {
  return (
    <>
      <PageTitle title="Progress" subtitle="What you can really use, what keeps coming back, and what to work on." />
      <Suspense fallback={<Loading />}>
        <ProgressContent />
      </Suspense>
    </>
  );
}

function pct(v: number | null) {
  return v === null ? "–" : `${Math.round(v * 100)}%`;
}

async function ProgressContent() {
  const app = await appDeps();
  if (!app) return <ButtonLink href="/login">Sign in</ButtonLink>;
  const [p, profile] = await Promise.all([getProgress(app.deps), getProfile(app.deps)]);
  const s = p.stats;
  const titles = Object.fromEntries(app.deps.content.grammarRules.map((r) => [r.id, r.title]));
  const totalBoxed = p.boxes.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Words you can really use" value={s.wordsYouCanUse} hint={`+${s.wordsYouCanUseThisWeek} this week`} />
        <Stat label="Words seen" value={s.wordsSeen} />
        <Stat label="Streak" value={`🔥 ${s.streak}`} hint={`${s.freezes} freeze${s.freezes === 1 ? "" : "s"}`} />
        <Stat label="Level" value={s.level} hint={`pace: ${s.pace}`} />
        <Stat label="Right first time" value={pct(s.accuracyLast7Days)} hint={`before: ${pct(s.accuracyPrevious7Days)}`} />
        <Stat label="Days this week" value={s.daysPracticedThisWeek} />
      </div>

      <WeeklyReportCard initial={p.weekly} titles={titles} />

      <Card>
        <h2 className="font-semibold">Mistakes that keep coming back</h2>
        <p className="text-sm text-muted">Last 14 days, compared with the 14 days before.</p>
        {p.mistakes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No mistakes recorded yet. Keep writing!</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {p.mistakes.map((m) => {
              const trend = m.count < m.previous ? "good" : m.count > m.previous && m.previous > 0 ? "bad" : "neutral";
              return (
                <li key={m.tag} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{m.title}</span>
                    <Badge tone={trend}>
                      {m.count}× {m.previous > 0 ? `(before: ${m.previous})` : ""}
                    </Badge>
                  </div>
                  {m.rule && <p className="mt-1 text-sm">{m.rule}</p>}
                  {m.wrong && (
                    <p className="mt-1 text-sm">
                      <span className="text-bad line-through">{m.wrong}</span> → <span className="text-good">{m.right}</span>
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ButtonLink href={`/practice?focus=${encodeURIComponent(m.tag)}`} variant="secondary">
                      Practise this
                    </ButtonLink>
                    <ButtonLink href={`/review?tag=${encodeURIComponent(m.tag)}`} variant="ghost">
                      See my sentences
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {s.quietWords.length > 0 && (
        <Card>
          <h2 className="font-semibold">Quiet words</h2>
          <p className="text-sm text-muted">You learned these but haven&apos;t used them on your own yet. They&apos;ll come back in practice.</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {s.quietWords.map((w) => (
              <li key={w}>
                <Badge tone="warn">{w}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">Review boxes</h2>
        <p className="text-sm text-muted">Each word moves up a box when you get it right, and comes back later. A mistake sends it back to box 1.</p>
        <div className="mt-3 grid grid-cols-5 gap-2 text-center">
          {p.boxes.map((n, i) => (
            <div key={i} className="rounded-xl bg-surface-2 p-2">
              <div className="text-lg font-semibold tabular-nums">{n}</div>
              <div className="text-[11px] text-muted">
                box {i + 1} · {BOX_INTERVALS_DAYS[i]}d
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-line">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: totalBoxed ? `${(n / totalBoxed) * 100}%` : 0 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Settings</h2>
        <p className="mb-3 text-sm text-muted">Change your name, how you write about yourself, or your level. The app also moves your level by itself.</p>
        <ProfileForm initialName={profile.name} initialLevel={profile.level} initialGender={profile.gender} submitLabel="Save" />
      </Card>
    </div>
  );
}
