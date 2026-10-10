import { Suspense } from "react";
import { ButtonLink, Loading, PageTitle } from "@/components/ui";
import { appDeps } from "@/lib/deps";
import { getRoleplay } from "@/lib/services/roleplay";
import { RoleplayClient } from "./RoleplayClient";

export default function RoleplayPage() {
  return (
    <>
      <PageTitle title="Weekly role-play" subtitle="A short chat in French, using the words you learned this week." />
      <Suspense fallback={<Loading />}>
        <RoleplayContent />
      </Suspense>
    </>
  );
}

async function RoleplayContent() {
  const app = await appDeps();
  if (!app) return <ButtonLink href="/login">Sign in</ButtonLink>;
  const view = await getRoleplay(app.deps);
  const ruleTitles = Object.fromEntries(app.deps.content.grammarRules.map((r) => [r.id, r.title]));
  return <RoleplayClient initial={view} ruleTitles={ruleTitles} />;
}
