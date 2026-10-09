// The numbers the learning logic needs. Real values come from .env through
// src/lib/config.ts; tests pass their own. Keeping them in one object means
// pure functions never read process.env and are easy to test.
export type Rules = {
  streakMinWords: number;
  maxChecksPerDay: number;
  minSentenceWords: number;
  minSentenceWordsLevel1: number;
  maxSentenceChars: number;
  batchSize: number;
  wordBankDays: number;
  wordBankMax: number;
  quietAfterDays: number;
  themeDays: number;
  roleplayMaxTurns: number;
};

export const TEST_RULES: Rules = {
  streakMinWords: 5,
  maxChecksPerDay: 50,
  minSentenceWords: 6,
  minSentenceWordsLevel1: 4,
  maxSentenceChars: 200,
  batchSize: 5,
  wordBankDays: 3,
  wordBankMax: 15,
  quietAfterDays: 4,
  themeDays: 7,
  roleplayMaxTurns: 10,
};
