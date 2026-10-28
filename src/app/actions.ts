"use server";

// Server Actions: the only way the browser changes data. Each one checks who
// is signed in (appDeps) and then calls a service in src/lib/services.
// Never trust input from the browser: services validate everything.

import { appDeps } from "@/lib/deps";
import { saveProfile } from "@/lib/services/account";
import { askFrench } from "@/lib/services/ask";
import { writeWeeklyReport } from "@/lib/services/coach";
import type { Result } from "@/lib/services/common";
import {
  dismissNotices,
  endPractice,
  getPractice,
  reportFeedback,
  showAnswer,
  skipItem,
  startPractice,
  startWriting,
  submitFix,
  submitRetype,
  submitSentence,
} from "@/lib/services/practice";
import { closeRoleplay, finishRoleplay, sendRoleplayMessage, startRoleplay } from "@/lib/services/roleplay";

const NOT_SIGNED_IN = { ok: false as const, error: "Please sign in again." };

async function withDeps<T>(fn: (deps: NonNullable<Awaited<ReturnType<typeof appDeps>>>["deps"]) => Promise<Result<T>>) {
  const app = await appDeps();
  if (!app) return NOT_SIGNED_IN;
  return fn(app.deps);
}

const str = (v: unknown, max = 1000) => (typeof v === "string" ? v.slice(0, max) : "");

/** Plain JSON only, and not too big (it comes from the browser). */
function safeContext(context: unknown): Record<string, unknown> {
  try {
    const json = JSON.stringify(context ?? {});
    return json.length <= 20_000 ? JSON.parse(json) : { truncated: true };
  } catch {
    return {};
  }
}

// Practice -------------------------------------------------------------------
export async function loadPracticeAction(timezone: string) {
  return withDeps((d) => getPractice(d, str(timezone, 64)));
}
export async function startPracticeAction(timezone: string, focusTag: string | null) {
  return withDeps((d) => startPractice(d, { timezone: str(timezone, 64), focusTag: focusTag ? str(focusTag, 64) : null }));
}
export async function startWritingAction() {
  return withDeps((d) => startWriting(d));
}
export async function submitSentenceAction(sentence: string) {
  return withDeps((d) => submitSentence(d, { sentence: str(sentence, 400) }));
}
export async function submitFixAction(attempt: string) {
  return withDeps((d) => submitFix(d, { attempt: str(attempt, 400) }));
}
export async function showAnswerAction() {
  return withDeps((d) => showAnswer(d));
}
export async function submitRetypeAction(text: string) {
  return withDeps((d) => submitRetype(d, { text: str(text, 400) }));
}
export async function skipItemAction() {
  return withDeps((d) => skipItem(d));
}
export async function endPracticeAction() {
  return withDeps((d) => endPractice(d));
}
export async function dismissNoticesAction() {
  return withDeps((d) => dismissNotices(d));
}
export async function reportAction(sentenceId: string | null, note: string, context: Record<string, unknown>) {
  return withDeps((d) =>
    reportFeedback(d, {
      sentenceId: sentenceId ? str(sentenceId, 64) : null,
      note: str(note, 1000),
      context: safeContext(context),
    }),
  );
}

// Account --------------------------------------------------------------------
/** Used with useActionState: (previous result, form data) → new result. */
export async function saveProfileAction(_prev: unknown, formData: FormData) {
  return withDeps((d) =>
    saveProfile(d, {
      name: str(formData.get("name"), 40),
      level: Number(formData.get("level")),
      gender: str(formData.get("gender"), 10),
      timezone: str(formData.get("timezone"), 64) || undefined,
    }),
  );
}

// Coach ----------------------------------------------------------------------
export async function weeklyReportAction() {
  return withDeps((d) => writeWeeklyReport(d));
}

// Role-play ------------------------------------------------------------------
export async function startRoleplayAction(scenarioId: string) {
  return withDeps((d) => startRoleplay(d, str(scenarioId, 64)));
}
export async function sendRoleplayAction(text: string) {
  return withDeps((d) => sendRoleplayMessage(d, str(text, 400)));
}
export async function finishRoleplayAction() {
  return withDeps((d) => finishRoleplay(d));
}
export async function closeRoleplayAction() {
  return withDeps((d) => closeRoleplay(d));
}

// Ask about French ------------------------------------------------------------
export async function askFrenchAction(question: string, history: unknown) {
  return withDeps((d) => askFrench(d, { question: str(question, 600), history: safeContext({ history }).history }));
}
