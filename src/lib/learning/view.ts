import type { Content, Pos, Word } from "@/lib/content/types";
import { displayWord } from "@/lib/content/types";
import { minWordsFor } from "./checks";
import type { Rules } from "./rules";
import { RETYPE_TRIES_BEFORE_SKIP } from "./session";
import { getDaily, type BatchReason, type Feedback, type ItemStage, type LearnerState } from "./state";
import { visibleStreak } from "./streak";
import { exampleEnFor, exampleFor } from "./templates";
import { wordBank, type WordBankEntry } from "./usage";

// Turns the saved state into exactly what the practice screen shows.
// Plain data only (it is sent to the browser), no functions, no secrets.

/**
 * The "N.B." lines for other meanings (README 3.2). An N.B.-only meaning is
 * always shown; a linked one only once the learner has seen the other entry.
 */
export function nbLines(word: Word, state: LearnerState, content: Content): string[] {
  return (word.other_meanings ?? []).flatMap((m) => {
    if (!m.word_id) return [m.nb];
    const other = content.wordById.get(m.word_id);
    if (!other || !state.words[other.id]) return [];
    return [`You learned '${other.french}' = ${other.english}. Here it means ${word.english}.`];
  });
}

export type ItemView = {
  type: "statement" | "question";
  pattern: string;
  example: string | null;
  exampleEn: string | null;
  stage: ItemStage;
  sentence: string | null;
  /** The learner's failed fix try, shown next to the answer. */
  fixAttempt: string | null;
  feedback: Feedback | null;
  fixTries: number;
  retypeTries: number;
  canSkip: boolean;
  fixOutcome: "self" | "shown" | "skipped" | null;
  sentenceId: string | null;
};

export type PracticeView = {
  today: { completed: number; goal: number; checksUsed: number; checksLeft: number };
  streak: number;
  level: number;
  session: null | {
    id: string;
    finished: boolean;
    focusTag: string | null;
    focusTitle: string | null;
    wordIndex: number;
    wordCount: number;
    completedInSession: string[];
    word: null | {
      id: string;
      display: string;
      english: string;
      pos: Pos;
      gender: Word["gender"];
      example: string;
      exampleEn: string;
      miniText: { fr: string; en: string };
      note: string | null;
      nb: string[];
      reason: BatchReason;
      stage: "read" | "write" | "done";
    };
    itemIndex: number;
    items: ItemView[];
    minWords: number;
  };
  wordBank: WordBankEntry[];
  notices: string[];
};

export function buildPracticeView(state: LearnerState, content: Content, rules: Rules, today: string): PracticeView {
  const daily = getDaily(state, today);
  const base: PracticeView = {
    today: {
      completed: daily.wordsCompleted.length,
      goal: rules.streakMinWords,
      checksUsed: daily.checks,
      checksLeft: Math.max(0, rules.maxChecksPerDay - daily.checks),
    },
    streak: visibleStreak(state.streak, today),
    level: state.profile.level,
    session: null,
    wordBank: [],
    notices: state.notices,
  };
  const s = state.session;
  if (!s) return base;

  const wp = s.finished ? null : s.words[s.wordIndex];
  const word = wp ? content.wordById.get(wp.wordId) ?? null : null;
  const level = state.profile.level;
  const items: ItemView[] =
    wp && word
      ? wp.items.map((it) => {
          const t = content.structureById.get(it.templateId);
          return {
            type: it.type,
            pattern: t?.pattern ?? "",
            example: t ? exampleFor(t, word.pos) : null,
            exampleEn: t ? exampleEnFor(t, word.pos) : null,
            stage: it.stage,
            sentence: it.sentence,
            fixAttempt: it.fixAttempt ?? null,
            feedback: it.feedback,
            fixTries: it.fixTries,
            retypeTries: it.retypeTries,
            canSkip: it.stage === "retype" && it.retypeTries >= RETYPE_TRIES_BEFORE_SKIP,
            fixOutcome: it.fixOutcome,
            sentenceId: it.sentenceId,
          };
        })
      : [];

  return {
    ...base,
    session: {
      id: s.id,
      finished: s.finished,
      focusTag: s.focusTag,
      focusTitle: s.focusTag ? content.ruleById.get(s.focusTag)?.title ?? null : null,
      wordIndex: s.wordIndex,
      wordCount: s.words.length,
      completedInSession: s.words
        .filter((w) => w.stage === "done")
        .map((w) => {
          const x = content.wordById.get(w.wordId);
          return x ? displayWord(x) : w.wordId;
        }),
      word:
        wp && word
          ? {
              id: word.id,
              display: displayWord(word),
              english: word.english,
              pos: word.pos,
              gender: word.gender,
              example: (state.profile.gender === "female" && word.example_f) || word.example,
              exampleEn: word.example_en,
              miniText: word.mini_text,
              note: word.note ?? null,
              nb: nbLines(word, state, content),
              reason: wp.reason,
              stage: wp.stage,
            }
          : null,
      itemIndex: wp?.itemIndex ?? 0,
      items,
      minWords: minWordsFor(level, rules),
    },
    wordBank: wordBank(
      state,
      content,
      today,
      rules,
      s.words.map((w) => w.wordId),
    ),
  };
}
