import { Suspense } from "react";
import { ButtonLink, Card, Loading, Notice, PageTitle } from "@/components/ui";
import { APP_MODE } from "@/lib/config";
import { appDeps } from "@/lib/deps";
import { getProfile } from "@/lib/services/account";
import { getPractice } from "@/lib/services/practice";
import { PracticeClient } from "./PracticeClient";

export default function PracticePage({ searchParams }: PageProps<"/practice">) {
  return (
    <>
      <PageTitle title="Practice" />
      <Suspense fallback={<Loading />}>
        <PracticeContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PracticeContent({ searchParams }: { searchParams: PageProps<"/practice">["searchParams"] }) {
  const params = await searchParams;
  const focus = typeof params.focus === "string" ? params.focus : null;
  const app = await appDeps();
  if (!app) {
    return (
      <Card>
        <p>Please sign in first.</p>
        <ButtonLink href="/login" className="mt-3">
          Sign in
        </ButtonLink>
      </Card>
    );
  }
  const profile = await getProfile(app.deps);
  if (!profile.onboarded) {
    return (
      <Card>
        <p>Let&apos;s set up your level first.</p>
        <ButtonLink href="/" className="mt-3">
          Go to the welcome steps
        </ButtonLink>
      </Card>
    );
  }
  const result = await getPractice(app.deps);
  if (!result.ok) return <Notice tone="bad">{result.error}</Notice>;
  const focusTag = focus && app.deps.content.ruleById.has(focus) ? focus : null;
  return <PracticeClient initial={result.data} focusTag={focusTag} testMode={APP_MODE === "test"} />;
}
