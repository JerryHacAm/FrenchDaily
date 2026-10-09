import { displayWord } from "@/lib/content/types";
import type { Feedback } from "@/lib/learning/state";
import type { Deps } from "./common";

// The Review page (ROADMAP B8): the learner's saved sentences and corrections.

export type ReviewItem = {
  id: string;
  date: string;
  word: string;
  english: string;
  itemType: "statement" | "question";
  original: string;
  feedback: Feedback;
};

export async function listReview(deps: Deps, limit = 100): Promise<ReviewItem[]> {
  const rows = await deps.store.listSentences(deps.userId, limit);
  return rows.map((r) => {
    const w = deps.content.wordById.get(r.wordId);
    return {
      id: r.id,
      date: r.localDate,
      word: w ? displayWord(w) : r.wordId,
      english: w?.english ?? "",
      itemType: r.itemType,
      original: r.original,
      feedback: r.feedback,
    };
  });
}
