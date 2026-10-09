import { Suspense } from "react";
import { connection } from "next/server";
import { APP_MODE, STREAK_MIN_WORDS, MAX_CHECKS_PER_DAY } from "@/lib/config";
import { checkSupabase } from "@/lib/supabase/server";

// Temporary setup page (Phase 0). It shows that the app runs and whether
// Supabase is reachable. It will be replaced by the real word page in Phase 1.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-3xl font-semibold">French Daily</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Setup check. The real app comes in Phase 1.
      </p>

      <ul className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <li>App mode: <strong>{APP_MODE}</strong></li>
        <li>Words per streak day: <strong>{STREAK_MIN_WORDS}</strong></li>
        <li>AI checks per day: <strong>{MAX_CHECKS_PER_DAY}</strong></li>
        <li>
          Supabase:{" "}
          <Suspense fallback={<strong className="text-zinc-500">checking…</strong>}>
            <SupabaseStatus />
          </Suspense>
        </li>
      </ul>
    </main>
  );
}

async function SupabaseStatus() {
  await connection(); // check on every visit, not once at build time
  const supabase = await checkSupabase();

  if (supabase.state === "ok") {
    return <strong className="text-green-600">connected</strong>;
  }
  if (supabase.state === "not-configured") {
    return <strong className="text-amber-600">not set up yet (fill in .env)</strong>;
  }
  return <strong className="text-red-600">error: {supabase.message}</strong>;
}
