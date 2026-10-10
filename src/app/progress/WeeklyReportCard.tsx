"use client";

import { useState, useTransition } from "react";
import { weeklyReportAction } from "@/app/actions";
import { Button, ButtonLink, Card, Notice } from "@/components/ui";
import type { WeeklyReport } from "@/lib/learning/state";

export function WeeklyReportCard({ initial, titles }: { initial: WeeklyReport | null; titles: Record<string, string> }) {
  const [report, setReport] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-accent">Weekly report</div>
      {report ? (
        <div className="mt-2 space-y-3">
          <p>{report.summary}</p>
          {report.wins.length > 0 && (
            <ul className="space-y-1 text-sm">
              {report.wins.map((w, i) => (
                <li key={i}>✓ {w}</li>
              ))}
            </ul>
          )}
          {report.focusTag && (
            <Notice tone="accent">
              <strong>Next week&apos;s focus: {titles[report.focusTag] ?? report.focusTag}.</strong> {report.focusReason}
            </Notice>
          )}
          {report.nextSteps.length > 0 && (
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {report.nextSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {report.focusTag && (
            <ButtonLink href={`/practice?focus=${encodeURIComponent(report.focusTag)}`} variant="secondary">
              Practise the focus
            </ButtonLink>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-muted">Your coach looks at this week&apos;s numbers and suggests one focus for next week.</p>
          {error && <Notice tone="warn" className="mt-2">{error}</Notice>}
          <Button
            className="mt-3"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const r = await weeklyReportAction();
                if (r.ok) setReport(r.data);
                else setError(r.error);
              })
            }
          >
            {pending ? "Writing your report…" : "Write this week's report"}
          </Button>
        </div>
      )}
    </Card>
  );
}
