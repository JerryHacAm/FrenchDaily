// Everything the app remembers about one learner, as one JSON object.
// Stored per user (Supabase table learner_state, or the local .data file).
// Logs that only grow (sentences, AI calls, events) live in separate tables.

export type Mistake = {
  /** A grammar rule id from data/grammar_rules.json, or "other". */
  tag: string;
  severity: "major" | "minor";
  original: string;
  fix: string;
  /** A nudge that does NOT give the answer (used in the fix step). */
  hint: string;
  short_explanation: string;
  detail: string;
};

export type Feedback = {
  structure_ok: boolean;
  /** What to add when structure_ok is false. Empty otherwise. */
  structure_note: string;
  is_correct: boolean;
  corrected_sentence: string;
  mistakes: Mistake[];
  example_sentences: { french: string; english: string }[];
  /** Base forms (lemmas) of the French words the learner used. */
  words_used: string[];
  encouragement: string;
};

export type UserWord = {
  wordId: string;
  introducedOn: string;
  /** Leitner box 1..5. */
  box: number;
  dueOn: string;
  timesSeen: number;
  lastSeenOn: string;
  completedCount: number;
  /** Times the learner used this word on their own (not as the target word). */
  selfUseCount: number;
  lastSelfUseOn: string | null;
  lastBoxMoveOn: string | null;
  /** Mistake tags made in sentences for this word. */
  tags: Record<string, number>;
};

export type ItemResult = {
  date: string;
  level: number;
  /** Structure ok and no major mistake on the first check. */
  firstTryOk: boolean;
  major: boolean;
};

export type DailyProgress = {
  checks: number;
  wordsCompleted: string[];
  itemsAccepted: number;
};

export type StreakState = {
  current: number;
  longest: number;
  freezes: number;
  lastCompletedDate: string | null;
  frozenDates: string[];
};

export type ItemStage = "write" | "fix" | "retype" | "accepted";

export type ItemProgress = {
  templateId: string;
  type: "statement" | "question";
  stage: ItemStage;
  checks: number;
  sentence: string | null;
  feedback: Feedback | null;
  /** Feedback from the first accepted-structure check (what we learn from). */
  firstFeedback: Feedback | null;
  fixTries: number;
  /** What the learner typed in the fix step (optional: older saves don't have it). */
  fixAttempt?: string | null;
  retypeTries: number;
  fixOutcome: "self" | "shown" | "skipped" | null;
  sentenceId: string | null;
};

export type WordProgress = {
  wordId: string;
  reason: BatchReason;
  stage: "read" | "write" | "done";
  items: ItemProgress[];
  itemIndex: number;
};

export type BatchReason = "review" | "quiet" | "new" | "weak" | "focus" | "extra";

export type PracticeSession = {
  id: string;
  startedAt: string;
  date: string;
  focusTag: string | null;
  words: WordProgress[];
  wordIndex: number;
  finished: boolean;
};

export type CoachNote = {
  date: string;
  /** "welcome" notes are replaced as soon as there is data to coach on. */
  source?: "welcome" | "ai" | "code";
  headline: string;
  message: string;
  focusTag: string | null;
  actionLabel: string;
};

export type WeeklyReport = {
  weekStart: string;
  summary: string;
  wins: string[];
  focusTag: string | null;
  focusReason: string;
  nextSteps: string[];
};

export type RoleplayMessage = { from: "ai" | "learner"; fr: string; en?: string };

export type RoleplayCorrection = {
  original: string;
  fix: string;
  explanation: string;
  tag: string;
};

export type RoleplaySession = {
  id: string;
  scenarioId: string;
  startedOn: string;
  weekWords: string[];
  messages: RoleplayMessage[];
  finished: boolean;
  summary: {
    overall: string;
    praise: string;
    corrections: RoleplayCorrection[];
    wordsUsed: string[];
  } | null;
};

export type LearnerState = {
  schema: 1;
  profile: {
    name: string;
    level: number;
    timezone: string;
    onboarded: boolean;
    createdAt: string;
    levelChangedOn: string | null;
  };
  theme: { current: string; startedOn: string } | null;
  words: Record<string, UserWord>;
  /** tag → date → count */
  mistakeLog: Record<string, Record<string, number>>;
  recentItems: ItemResult[];
  daily: Record<string, DailyProgress>;
  streak: StreakState;
  recentTemplates: string[];
  session: PracticeSession | null;
  coach: { daily: CoachNote | null; weekly: WeeklyReport | null };
  roleplay: RoleplaySession | null;
  /** Date of the last finished role-play (weekly habit). */
  lastRoleplayOn?: string | null;
  /** Messages shown once on the home page (level change, freeze used…). */
  notices: string[];
};

export const MAX_RECENT_ITEMS = 100;
export const MAX_RECENT_TEMPLATES = 20;
export const DAILY_KEEP_DAYS = 90;

export function createInitialState(nowIso: string, timezone: string): LearnerState {
  return {
    schema: 1,
    profile: {
      name: "",
      level: 1,
      timezone,
      onboarded: false,
      createdAt: nowIso,
      levelChangedOn: null,
    },
    theme: null,
    words: {},
    mistakeLog: {},
    recentItems: [],
    daily: {},
    streak: { current: 0, longest: 0, freezes: 0, lastCompletedDate: null, frozenDates: [] },
    recentTemplates: [],
    session: null,
    coach: { daily: null, weekly: null },
    roleplay: null,
    notices: [],
  };
}

export function emptyDaily(): DailyProgress {
  return { checks: 0, wordsCompleted: [], itemsAccepted: 0 };
}

export function getDaily(state: LearnerState, date: string): DailyProgress {
  return state.daily[date] ?? emptyDaily();
}

/** Returns a copy of the state with the day's progress replaced. */
export function withDaily(state: LearnerState, date: string, daily: DailyProgress): LearnerState {
  const all = { ...state.daily, [date]: daily };
  const keys = Object.keys(all).sort();
  while (keys.length > DAILY_KEEP_DAYS) delete all[keys.shift()!];
  return { ...state, daily: all };
}

/** Deep copy, so pure functions can never change the caller's object by mistake. */
export function cloneState(state: LearnerState): LearnerState {
  return structuredClone(state);
}
