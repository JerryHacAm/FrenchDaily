import { Suspense } from "react";
import { Card, Loading, Notice, PageTitle, Stat } from "@/components/ui";
import { RULES } from "@/lib/config";
import { getContext } from "@/lib/context";
import { getStats } from "@/lib/services/stats";

// Pilot stats for Jerry and quantrungvu (ROADMAP F2, F3): how long a day of
// practice really takes, words, accuracy and AI cost per learner.
export default function StatsPage() {
  return (
    <>
      <PageTitle title="Pilot stats" subtitle="Last 14 days. Use this to decide the daily load (ROADMAP F3)." />
      <Suspense fallback={<Loading />}>
        <StatsContent />
      </Suspense>
    </>
  );
}

function usd(v: number) {
  return v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}

async function StatsContent() {
  const ctx = await getContext();
  if (!ctx.user?.isAdmin) {
    return <Notice tone="warn">Only Jerry and quantrungvu can see this page (ADMIN_EMAILS in .env).</Notice>;
  }
  const users = await getStats(ctx.store, new Date());
  if (users.length === 0) return <p className="text-muted">No data yet.</p>;

  return (
    <div className="space-y-6">
      {users.map((u) => (
        <Card key={u.userId} className="space-y-4">
          <h2 className="text-lg font-semibold">{u.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Active days" value={u.activeDays} />
            <Stat label="Minutes per active day" value={u.avgMinutesPerActiveDay} />
            <Stat
              label={`Minutes for ${RULES.streakMinWords} words`}
              value={u.minutesPerWord === null ? "–" : Math.round(u.minutesPerWord * RULES.streakMinWords)}
              hint="estimate"
            />
            <Stat label="AI cost" value={usd(u.totalCostUsd)} hint={u.costPerWordUsd === null ? undefined : `${usd(u.costPerWordUsd)} per word`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 pr-3 font-medium">Day</th>
                  <th className="py-1 pr-3 font-medium">Minutes</th>
                  <th className="py-1 pr-3 font-medium">Words</th>
                  <th className="py-1 pr-3 font-medium">Checks</th>
                  <th className="py-1 pr-3 font-medium">Right 1st try</th>
                  <th className="py-1 pr-3 font-medium">AI calls</th>
                  <th className="py-1 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {u.days.map((d) => (
                  <tr key={d.date} className="border-t border-line">
                    <td className="py-1 pr-3">{d.date}</td>
                    <td className="py-1 pr-3">{d.minutes}</td>
                    <td className="py-1 pr-3">{d.wordsCompleted}</td>
                    <td className="py-1 pr-3">{d.itemsChecked}</td>
                    <td className="py-1 pr-3">{d.firstTryOkShare === null ? "–" : `${Math.round(d.firstTryOkShare * 100)}%`}</td>
                    <td className="py-1 pr-3">{d.aiCalls}</td>
                    <td className="py-1">{usd(d.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
      <p className="text-xs text-muted">
        Minutes are estimated from activity: gaps over 5 minutes count as a break. AI cost uses AI_PRICE_* from .env.
      </p>
    </div>
  );
}
