import Link from "next/link";
import { Suspense } from "react";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Badge, ButtonLink, Card, cx, Loading, PageTitle } from "@/components/ui";
import { appDeps } from "@/lib/deps";
import { listReview } from "@/lib/services/review";

// Review page (ROADMAP B8): every sentence with its correction, newest first.
export default function ReviewPage({ searchParams }: PageProps<"/review">) {
  return (
    <>
      <PageTitle title="Review" subtitle="Your sentences and their corrections. Rereading them helps them stick." />
      <Suspense fallback={<Loading />}>
        <ReviewContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReviewContent({ searchParams }: { searchParams: PageProps<"/review">["searchParams"] }) {
  const params = await searchParams;
  const tag = typeof params.tag === "string" ? params.tag : null;
  const app = await appDeps();
  if (!app) return <ButtonLink href="/login">Sign in</ButtonLink>;
  const all = await listReview(app.deps, 200);
  if (all.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-muted">No sentences yet.</p>
        <ButtonLink href="/practice" className="mt-3">
          Write your first sentences
        </ButtonLink>
      </Card>
    );
  }

  // Mistake types that appear, for the filter chips.
  const counts = new Map<string, number>();
  for (const item of all) for (const m of item.feedback.mistakes) counts.set(m.tag, (counts.get(m.tag) ?? 0) + 1);
  const rules = app.deps.content.ruleById;
  const items = tag ? all.filter((i) => i.feedback.mistakes.some((m) => m.tag === tag)) : all;

  // Group by day.
  const byDate = new Map<string, typeof items>();
  for (const item of items) byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);

  return (
    <div className="space-y-5">
      {counts.size > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Filter by mistake type">
          <Link href="/review" className={cx("rounded-full px-3 py-1 text-sm", !tag ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}>
            All ({all.length})
          </Link>
          {[...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([t, n]) => (
              <Link
                key={t}
                href={`/review?tag=${encodeURIComponent(t)}`}
                className={cx("rounded-full px-3 py-1 text-sm", tag === t ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}
              >
                {rules.get(t)?.title ?? t} ({n})
              </Link>
            ))}
        </div>
      )}
      {tag && rules.get(tag) && (
        <Card>
          <h2 className="font-semibold">{rules.get(tag)!.title}</h2>
          <p className="mt-1 text-sm">{rules.get(tag)!.rule}</p>
          <ButtonLink href={`/practice?focus=${encodeURIComponent(tag)}`} variant="secondary" className="mt-3">
            Practise this
          </ButtonLink>
        </Card>
      )}
      {[...byDate.entries()].map(([date, list]) => (
        <section key={date}>
          <h2 className="mb-2 text-sm font-medium text-muted">{date}</h2>
          <div className="space-y-2">
            {list.map((item) => (
              <details key={item.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                  <Badge tone={item.feedback.is_correct ? "good" : item.feedback.structure_ok ? "warn" : "neutral"}>
                    {item.feedback.is_correct ? "✓" : item.feedback.structure_ok ? `${item.feedback.mistakes.length} fix` : "retry"}
                  </Badge>
                  <span className="fr">{item.feedback.structure_ok ? item.feedback.corrected_sentence : item.original}</span>
                  <span className="text-xs text-muted">· {item.word}</span>
                </summary>
                <div className="pt-3">
                  {item.feedback.structure_ok ? (
                    <FeedbackCard sentence={item.original} feedback={item.feedback} sentenceId={item.id} mode="full" />
                  ) : (
                    <p className="text-sm text-muted">
                      &ldquo;{item.original}&rdquo;: {item.feedback.structure_note || "needed a little more."}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
