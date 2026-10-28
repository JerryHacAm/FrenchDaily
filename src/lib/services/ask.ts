import type { AskMessage } from "@/lib/ai/types";
import { checksLeft, countCheck } from "@/lib/learning/session";
import { cloneState } from "@/lib/learning/state";
import { ConflictError } from "@/lib/store/types";
import { callAi, fail, load, logEvent, ok, save, userMessage, type Deps, type Loaded, type Result } from "./common";

// "Ask about French": the chat bubble on every page. The learner asks any
// question about French and the AI answers. The chat itself lives in the
// browser (nothing is saved); each question uses one AI check from the daily cap.

export const MAX_QUESTION_CHARS = 500;
/** How many earlier messages go to the AI as context (keeps the cost small). */
export const ASK_HISTORY = 8;
const MAX_HISTORY_CHARS = 3000;

export type AskView = { answer: string; checksLeft: number };

/** The chat comes from the browser: keep only well-formed, recent messages. */
export function cleanHistory(history: unknown): AskMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m): m is AskMessage =>
        typeof m === "object" && m !== null && (m.from === "learner" || m.from === "ai") && typeof m.text === "string",
    )
    .map((m) => ({ from: m.from, text: m.text.trim().slice(0, MAX_HISTORY_CHARS) }))
    .filter((m) => m.text)
    .slice(-ASK_HISTORY);
}

export async function askFrench(deps: Deps, input: { question: string; history: unknown }): Promise<Result<AskView>> {
  let loaded: Loaded;
  try {
    loaded = await load(deps);
  } catch (err) {
    return fail(userMessage(err));
  }
  const { state, today } = loaded;
  const question = input.question.trim();
  if (!question) return fail("Type a question first.");
  if (question.length > MAX_QUESTION_CHARS) return fail(`Keep it under ${MAX_QUESTION_CHARS} characters.`);
  if (checksLeft(state, today, deps.rules) <= 0) return fail("No AI checks left today. Come back tomorrow!");

  try {
    const r = await callAi(deps, "ask", () =>
      deps.ai.askFrench({
        level: state.profile.level,
        learnerGender: state.profile.gender ?? null,
        messages: [...cleanHistory(input.history), { from: "learner", text: question }],
      }),
    );
    const left = await countAndSave(deps, loaded);
    await logEvent(deps, "question_asked", today, { chars: question.length });
    return ok({ answer: r.data.answer.trim(), checksLeft: left });
  } catch (err) {
    return fail(userMessage(err));
  }
}

/**
 * Counts the check. The AI takes a few seconds, so the practice page may have
 * saved in the meantime: then load again and count on top of that.
 */
async function countAndSave(deps: Deps, loaded: Loaded): Promise<number> {
  let current = loaded;
  for (let attempt = 1; ; attempt++) {
    const next = countCheck(cloneState(current.state), current.today);
    try {
      await save(deps, current, next);
      return checksLeft(next, current.today, deps.rules);
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt >= 2) throw err;
      current = await load(deps);
    }
  }
}
