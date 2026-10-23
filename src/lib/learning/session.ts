import type { Content } from "@/lib/content/types";
import { hasMajorMistake, isSelfFixed } from "./feedback";
import { decideLevel } from "./levels";
import { recordMistakes } from "./mistakes";
import { planBatch } from "./picker";
import type { Rng } from "./random";
import type { Rules } from "./rules";
import { applySelfUse, applyWordCompletion, newUserWord } from "./srs";
import {
  cloneState,
  getDaily,
  MAX_RECENT_ITEMS,
  MAX_RECENT_TEMPLATES,
  withDaily,
  type Feedback,
  type ItemProgress,
  type LearnerState,
  type PracticeSession,
  type WordProgress,
} from "./state";
import { recordStreakDay } from "./streak";
import { pickTemplates } from "./templates";
import { lemmasToSeenWordIds } from "./usage";

// The practice flow as pure state changes (no AI, no database here).
// Per word:  read → write item 1..3 → done
// Per item:  write → (AI check) → accepted
//                              ↘ fix (hint) → accepted (self-fixed)
//                                           ↘ retype (answer shown) → accepted
// The service layer (src/lib/practice) calls the AI and saves the result.

export class FlowError extends Error {}

function session(state: LearnerState): PracticeSession {
  if (!state.session || state.session.finished) throw new FlowError("No practice in progress.");
  return state.session;
}

export function currentWordProgress(state: LearnerState): WordProgress {
  const s = session(state);
  return s.words[s.wordIndex];
}

export function currentItem(state: LearnerState): ItemProgress {
  const w = currentWordProgress(state);
  if (w.stage !== "write") throw new FlowError("Read the word first.");
  return w.items[w.itemIndex];
}

/** Marks a word as seen (introduces it the first time). */
function enterWord(state: LearnerState, wordId: string, today: string): LearnerState {
  const existing = state.words[wordId];
  const uw = existing ? { ...existing } : newUserWord(wordId, today);
  uw.timesSeen += 1;
  uw.lastSeenOn = today;
  return { ...state, words: { ...state.words, [wordId]: uw } };
}

export type StartResult = { state: LearnerState; started: boolean };

export function startSession(
  input: LearnerState,
  content: Content,
  rules: Rules,
  today: string,
  nowIso: string,
  rng: Rng,
  options: { focusTag?: string | null; sessionId: string },
): StartResult {
  let state = cloneState(input);
  const plan = planBatch(state, content, rules, today, rng, { focusTag: options.focusTag });
  if (plan.words.length === 0) return { state, started: false };

  let recent = [...state.recentTemplates];
  const words: WordProgress[] = plan.words.map(({ wordId, reason }) => {
    const word = content.wordById.get(wordId)!;
    const templates = pickTemplates(content.structures, word.pos, state.profile.level, recent, rng);
    recent = [...recent, ...templates.map((t) => t.id)].slice(-MAX_RECENT_TEMPLATES);
    return {
      wordId,
      reason,
      stage: "read",
      itemIndex: 0,
      items: templates.map((t) => ({
        templateId: t.id,
        type: t.type,
        stage: "write" as const,
        checks: 0,
        sentence: null,
        feedback: null,
        firstFeedback: null,
        fixTries: 0,
        retypeTries: 0,
        fixOutcome: null,
        sentenceId: null,
      })),
    };
  });

  state.recentTemplates = recent;
  state.theme = plan.theme;
  state.session = {
    id: options.sessionId,
    startedAt: nowIso,
    date: today,
    focusTag: options.focusTag ?? null,
    words,
    wordIndex: 0,
    finished: false,
  };
  state = enterWord(state, words[0].wordId, today);
  return { state, started: true };
}

/** "I've read it" → start writing. */
export function beginWriting(input: LearnerState): LearnerState {
  const state = cloneState(input);
  const w = currentWordProgress(state);
  if (w.stage === "read") w.stage = "write";
  return state;
}

/** Counts one AI check against today's cap. */
export function countCheck(state: LearnerState, today: string): LearnerState {
  const d = getDaily(state, today);
  return withDaily(state, today, { ...d, checks: d.checks + 1 });
}

export function checksLeft(state: LearnerState, today: string, rules: Rules): number {
  return Math.max(0, rules.maxChecksPerDay - getDaily(state, today).checks);
}

export type CheckOutcome = "structure_retry" | "accepted" | "fix";

/** Applies the AI's feedback to the current item. */
export function applyCheck(
  input: LearnerState,
  content: Content,
  rules: Rules,
  today: string,
  sentence: string,
  feedback: Feedback,
  sentenceId: string,
): { state: LearnerState; outcome: CheckOutcome } {
  let state = cloneState(input);
  const item = currentItem(state);
  if (item.stage !== "write") throw new FlowError("This sentence was already checked.");
  item.checks += 1;
  item.sentence = sentence;
  item.feedback = feedback;
  item.sentenceId = sentenceId;
  if (!feedback.structure_ok) return { state, outcome: "structure_retry" };
  item.firstFeedback ??= feedback;
  if (feedback.is_correct) {
    state = acceptItem(state, content, rules, today, null);
    return { state, outcome: "accepted" };
  }
  item.stage = "fix";
  return { state, outcome: "fix" };
}

export type FixOutcome = "accepted" | "retype";

/** The learner tried to fix the sentence after seeing the hints. One try, then the answer. */
export function applyFixAttempt(
  input: LearnerState,
  content: Content,
  rules: Rules,
  today: string,
  attempt: string,
): { state: LearnerState; outcome: FixOutcome } {
  let state = cloneState(input);
  const item = currentItem(state);
  if (item.stage !== "fix" || !item.feedback) throw new FlowError("Nothing to fix right now.");
  item.fixTries += 1;
  item.fixAttempt = attempt;
  if (isSelfFixed(attempt, item.feedback)) {
    state = acceptItem(state, content, rules, today, "self");
    return { state, outcome: "accepted" };
  }
  item.stage = "retype";
  return { state, outcome: "retype" };
}

/** "Show me the answer" without trying. */
export function revealAnswer(input: LearnerState): LearnerState {
  const state = cloneState(input);
  const item = currentItem(state);
  if (item.stage !== "fix") throw new FlowError("Nothing to reveal right now.");
  item.stage = "retype";
  return state;
}

export type RetypeOutcome = "accepted" | "try_again";

/** The learner retypes the corrected sentence (accents count). */
export function applyRetype(
  input: LearnerState,
  content: Content,
  rules: Rules,
  today: string,
  text: string,
  same: (a: string, b: string) => boolean,
): { state: LearnerState; outcome: RetypeOutcome } {
  let state = cloneState(input);
  const item = currentItem(state);
  if (item.stage !== "retype" || !item.feedback) throw new FlowError("Nothing to retype right now.");
  if (same(text, item.feedback.corrected_sentence)) {
    state = acceptItem(state, content, rules, today, "shown");
    return { state, outcome: "accepted" };
  }
  item.retypeTries += 1;
  return { state, outcome: "try_again" };
}

export const RETYPE_TRIES_BEFORE_SKIP = 2;

/** After a few failed retypes the learner may move on. */
export function skipRetype(input: LearnerState, content: Content, rules: Rules, today: string): LearnerState {
  const state = cloneState(input);
  const item = currentItem(state);
  if (item.stage !== "retype" || item.retypeTries < RETYPE_TRIES_BEFORE_SKIP) {
    throw new FlowError("Try retyping the sentence first.");
  }
  return acceptItem(state, content, rules, today, "skipped");
}

function acceptItem(
  input: LearnerState,
  content: Content,
  rules: Rules,
  today: string,
  fixOutcome: ItemProgress["fixOutcome"],
): LearnerState {
  let state = input;
  const s = session(state);
  const wp = s.words[s.wordIndex];
  const item = wp.items[wp.itemIndex];
  const fb = item.firstFeedback ?? item.feedback!;
  item.stage = "accepted";
  item.fixOutcome = fixOutcome;

  const major = hasMajorMistake(fb);
  state.recentItems = [
    ...state.recentItems,
    { date: today, level: state.profile.level, firstTryOk: item.checks === 1 && !major, major },
  ].slice(-MAX_RECENT_ITEMS);

  state = recordMistakes(state, fb.mistakes.map((m) => m.tag), wp.wordId, today);

  // Words used on the learner's own (not the target word) — Jerry's idea.
  if (!major) {
    const words = { ...state.words };
    for (const id of lemmasToSeenWordIds(fb.words_used, state, content)) {
      if (id !== wp.wordId && words[id]) words[id] = applySelfUse(words[id], today);
    }
    state = { ...state, words };
  }

  const d = getDaily(state, today);
  state = withDaily(state, today, { ...d, itemsAccepted: d.itemsAccepted + 1 });

  if (wp.itemIndex < wp.items.length - 1) {
    wp.itemIndex += 1;
    return state;
  }
  return completeWord(state, content, rules, today);
}

function completeWord(input: LearnerState, content: Content, rules: Rules, today: string): LearnerState {
  let state = input;
  const s = session(state);
  const wp = s.words[s.wordIndex];
  wp.stage = "done";
  const hadMajor = wp.items.some((i) => i.firstFeedback && hasMajorMistake(i.firstFeedback));
  const uw = state.words[wp.wordId] ?? newUserWord(wp.wordId, today);
  state = { ...state, words: { ...state.words, [wp.wordId]: applyWordCompletion(uw, hadMajor, today) } };

  const d = getDaily(state, today);
  const completed = d.wordsCompleted.includes(wp.wordId) ? d.wordsCompleted : [...d.wordsCompleted, wp.wordId];
  state = withDaily(state, today, { ...d, wordsCompleted: completed });
  const notices = [...state.notices];

  if (completed.length >= rules.streakMinWords) {
    const r = recordStreakDay(state.streak, today);
    state = { ...state, streak: r.streak };
    notices.push(...r.notices);
  }

  const level = decideLevel(state.recentItems, state.profile.level, today, state.profile.levelChangedOn);
  if (level.action !== "stay") {
    state = { ...state, profile: { ...state.profile, level: level.newLevel, levelChangedOn: today } };
    if (level.message) notices.push(level.message);
  }
  state = { ...state, notices };

  const sess = state.session!;
  if (sess.wordIndex < sess.words.length - 1) {
    sess.wordIndex += 1;
    state = enterWord(state, sess.words[sess.wordIndex].wordId, today);
  } else {
    sess.finished = true;
  }
  return state;
}

/** Removes notices once shown. */
export function clearNotices(state: LearnerState): LearnerState {
  return state.notices.length ? { ...state, notices: [] } : state;
}
