import { describe, expect, it } from "vitest";
import { onboardedState, REAL_CONTENT } from "@/test/fixtures";
import { hasMajorMistake, isSelfFixed, normalizeFeedback, type RawFeedback } from "./feedback";
import { seededRng } from "./random";
import { TEST_RULES } from "./rules";
import {
  applyCheck,
  applyFixAttempt,
  applyRetype,
  beginWriting,
  currentItem,
  currentWordProgress,
  FlowError,
  revealAnswer,
  skipRetype,
  startSession,
} from "./session";
import type { Feedback, LearnerState } from "./state";
import { sameSentence } from "./text";
import { buildPracticeView } from "./view";

const today = "2026-10-10";
const known = new Set(REAL_CONTENT.grammarRules.map((r) => r.id));

function raw(partial: Partial<RawFeedback> = {}): RawFeedback {
  return {
    structure_ok: true,
    structure_note: "",
    is_question: false,
    is_correct: true,
    corrected_sentence: "Je mange une pomme le matin.",
    corrected_english: "I eat an apple in the morning.",
    mistakes: [],
    example_sentences: [
      { french: "La pomme est rouge.", english: "The apple is red." },
      { french: "Tu veux une pomme ?", english: "Do you want an apple?" },
    ],
    words_used: ["je", "manger", "pomme"],
    encouragement: "Nice!",
    ...partial,
  };
}

const genderMistake = {
  tag: "article-gender",
  severity: "major" as const,
  original: "un pomme",
  fix: "une pomme",
  hint: "Is 'pomme' masculine or feminine?",
  short_explanation: "Pomme is feminine.",
  detail: "…",
};

describe("normalizeFeedback (product rules on the AI answer)", () => {
  const input = { sentence: "Je mange un pomme le matin.", itemType: "statement" as const, knownTags: known };

  it("keeps at most 2 mistakes and 2 examples, and maps unknown tags to 'other'", () => {
    const f = normalizeFeedback(
      raw({
        is_correct: false,
        corrected_sentence: "Je mange une pomme le matin.",
        mistakes: [genderMistake, { ...genderMistake, tag: "made-up" }, genderMistake],
        example_sentences: [...raw().example_sentences, { french: "Encore.", english: "Again." }],
      }),
      input,
    );
    expect(f.mistakes).toHaveLength(2);
    expect(f.mistakes[1].tag).toBe("other");
    expect(f.example_sentences).toHaveLength(2);
    expect(f.is_correct).toBe(false);
  });

  it("treats 'no mistakes' as correct and keeps the learner's sentence", () => {
    const f = normalizeFeedback(raw({ is_correct: false, corrected_sentence: "Je mange une autre pomme." }), {
      ...input,
      sentence: "Je mange une pomme le matin.",
    });
    expect(f.is_correct).toBe(true);
    expect(f.corrected_sentence).toBe("Je mange une pomme le matin.");
  });

  it("makes an accent-only slip minor, even when the AI called it major", () => {
    const accent = { ...genderMistake, tag: "prepositions-place", original: "a l'ecole", fix: "à l'école" };
    const f = normalizeFeedback(raw({ is_correct: false, mistakes: [accent, genderMistake] }), input);
    expect(f.mistakes[0]).toMatchObject({ severity: "minor", tag: "spelling-accent" });
    expect(f.mistakes[1].severity).toBe("major"); // a real grammar mistake stays major
  });

  it("fails the structure when a question was asked for but not written", () => {
    const f = normalizeFeedback(raw({ is_question: false }), { ...input, itemType: "question" });
    expect(f.structure_ok).toBe(false);
    expect(f.structure_note).toMatch(/question/);
  });

  it("builds a correction when the AI listed a mistake but repeated the sentence", () => {
    const f = normalizeFeedback(
      raw({ is_correct: false, corrected_sentence: "Je mange un pomme le matin.", mistakes: [genderMistake] }),
      input,
    );
    expect(f.corrected_sentence).toBe("Je mange une pomme le matin.");
  });

  it("recognises a self-fixed sentence", () => {
    const f = normalizeFeedback(raw({ is_correct: false, mistakes: [genderMistake] }), input);
    expect(isSelfFixed("Je mange une pomme le matin", f)).toBe(true);
    expect(isSelfFixed("Le matin, je mange une pomme.", f)).toBe(true); // different order, error fixed
    expect(isSelfFixed("Je mange un pomme le matin.", f)).toBe(false);
    expect(hasMajorMistake(f)).toBe(true);
  });
});

function start(state: LearnerState = onboardedState(), rules = TEST_RULES) {
  const r = startSession(state, REAL_CONTENT, rules, today, "2026-10-10T09:00:00Z", seededRng(7), { sessionId: "s1" });
  expect(r.started).toBe(true);
  return beginWriting(r.state);
}

function feedback(partial: Partial<RawFeedback> = {}, sentence = "Je mange une pomme le matin.", itemType: "statement" | "question" = "statement"): Feedback {
  return normalizeFeedback(raw({ corrected_sentence: sentence, is_question: itemType === "question", ...partial }), {
    sentence,
    itemType,
    knownTags: known,
  });
}

/** Accepts the current item with a correct sentence. */
function acceptCurrent(state: LearnerState, rules = TEST_RULES): LearnerState {
  const item = currentItem(state);
  const s = item.type === "question" ? "Tu manges une pomme ?" : "Je mange une pomme le matin.";
  return applyCheck(state, REAL_CONTENT, rules, today, s, feedback({}, s, item.type), "x").state;
}

describe("practice session flow", () => {
  it("starts with the read step, then 3 items per word", () => {
    const r = startSession(onboardedState(), REAL_CONTENT, TEST_RULES, today, "t", seededRng(7), { sessionId: "s1" });
    expect(currentWordProgress(r.state).stage).toBe("read");
    expect(() => currentItem(r.state)).toThrow(FlowError);
    const s = beginWriting(r.state);
    expect(currentWordProgress(s).items.map((i) => i.type)).toEqual(["statement", "statement", "question"]);
    expect(Object.keys(s.words)).toHaveLength(1); // only the current word is introduced
  });

  it("asks again when the structure is missing, without counting it as accepted", () => {
    let s = start();
    s = applyCheck(s, REAL_CONTENT, TEST_RULES, today, "Pomme.", feedback({ structure_ok: false, structure_note: "Add a verb." }), "x").state;
    expect(currentItem(s).stage).toBe("write");
    expect(currentItem(s).checks).toBe(1);
    s = acceptCurrent(s);
    expect(s.recentItems.at(-1)?.firstTryOk).toBe(false); // needed 2 checks
  });

  it("goes fix → accepted when the learner fixes it themselves", () => {
    let s = start();
    const f = feedback({ is_correct: false, mistakes: [genderMistake] }, "Je mange un pomme le matin.");
    s = applyCheck(s, REAL_CONTENT, TEST_RULES, today, "Je mange un pomme le matin.", f, "x").state;
    expect(currentItem(s).stage).toBe("fix");
    const r = applyFixAttempt(s, REAL_CONTENT, TEST_RULES, today, "Je mange une pomme le matin.");
    expect(r.outcome).toBe("accepted");
    expect(r.state.mistakeLog["article-gender"][today]).toBe(1);
    expect(currentWordProgress(r.state).itemIndex).toBe(1);
  });

  it("goes fix → retype (answer shown) → accepted, and allows skipping after 2 failed retypes", () => {
    let s = start();
    const f = feedback({ is_correct: false, mistakes: [genderMistake] }, "Je mange un pomme le matin.");
    s = applyCheck(s, REAL_CONTENT, TEST_RULES, today, "Je mange un pomme le matin.", f, "x").state;
    s = applyFixAttempt(s, REAL_CONTENT, TEST_RULES, today, "Je mange un pomme.").state;
    expect(currentItem(s).stage).toBe("retype");
    expect(buildPracticeView(s, REAL_CONTENT, TEST_RULES, today).session?.items[0].fixAttempt).toBe("Je mange un pomme.");
    expect(() => skipRetype(s, REAL_CONTENT, TEST_RULES, today)).toThrow(FlowError);
    s = applyRetype(s, REAL_CONTENT, TEST_RULES, today, "Je mange une pome le matin.", sameSentence).state;
    s = applyRetype(s, REAL_CONTENT, TEST_RULES, today, "Je mange une pome le matin.", sameSentence).state;
    expect(buildPracticeView(s, REAL_CONTENT, TEST_RULES, today).session?.items[0].canSkip).toBe(true);
    const ok = applyRetype(s, REAL_CONTENT, TEST_RULES, today, "je mange une pomme le matin", sameSentence);
    expect(ok.outcome).toBe("accepted");
    expect(ok.state.session!.words[0].items[0].fixOutcome).toBe("shown");
  });

  it("shows the female example (example_f) to a female learner only", () => {
    const s = start();
    s.session!.words[0].wordId = "w0068"; // fatigué
    const example = (gender: "male" | "female" | null) =>
      buildPracticeView({ ...s, profile: { ...s.profile, gender } }, REAL_CONTENT, TEST_RULES, today).session?.word?.example;
    expect(example("female")).toBe("Je suis fatiguée après le travail.");
    expect(example("male")).toBe("Je suis fatigué après le travail.");
    expect(example(null)).toBe("Je suis fatigué après le travail.");
  });

  it("can reveal the answer without trying", () => {
    let s = start();
    const f = feedback({ is_correct: false, mistakes: [genderMistake] }, "Je mange un pomme le matin.");
    s = applyCheck(s, REAL_CONTENT, TEST_RULES, today, "Je mange un pomme le matin.", f, "x").state;
    expect(currentItem(revealAnswer(s)).stage).toBe("retype");
  });

  it("completes a word after 3 items: box up, daily count, next word introduced", () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = acceptCurrent(s);
    const done = s.session!.words[0];
    expect(done.stage).toBe("done");
    expect(s.words[done.wordId]).toMatchObject({ box: 2, completedCount: 1, dueOn: "2026-10-13" });
    expect(s.daily[today].wordsCompleted).toEqual([done.wordId]);
    expect(s.session!.wordIndex).toBe(1);
    expect(currentWordProgress(s).stage).toBe("read");
    expect(Object.keys(s.words)).toHaveLength(2);
  });

  it("starts the streak when the daily goal is reached, and finishes the batch", () => {
    const rules = { ...TEST_RULES, streakMinWords: 2, batchSize: 2 };
    let s = start(onboardedState(), rules);
    for (let w = 0; w < 2; w++) {
      if (currentWordProgress(s).stage === "read") s = beginWriting(s);
      for (let i = 0; i < 3; i++) s = acceptCurrent(s, rules);
    }
    expect(s.streak).toMatchObject({ current: 1, lastCompletedDate: today });
    expect(s.session!.finished).toBe(true);
    const view = buildPracticeView(s, REAL_CONTENT, rules, today);
    expect(view.session?.finished).toBe(true);
    expect(view.today).toMatchObject({ completed: 2, goal: 2 });
  });

  it("counts words the learner used on their own (not the target word)", () => {
    let s = onboardedState();
    s.words.w0006 = { wordId: "w0006", introducedOn: "2026-10-01", box: 1, dueOn: "2026-10-02", timesSeen: 1, lastSeenOn: today, completedCount: 1, selfUseCount: 0, lastSelfUseOn: null, lastBoxMoveOn: null, tags: {} };
    s = start(s);
    const target = currentWordProgress(s).wordId;
    s = acceptCurrent(s); // feedback words_used includes "manger" (w0006)
    expect(target).not.toBe("w0006"); // seen today, so not picked again
    expect(s.words.w0006.selfUseCount).toBe(1);
    expect(s.words.w0006.box).toBe(2); // it was due → using it counts as a review
  });
});
