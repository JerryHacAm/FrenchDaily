import type { Content, Word } from "@/lib/content/types";
import { fallbackCoachNote, type CoachStats } from "@/lib/learning/coach";
import type { RawFeedback } from "@/lib/learning/feedback";
import type { Mistake } from "@/lib/learning/state";
import { findWordsUsed, normalize } from "@/lib/learning/text";
import type { CoachNoteOut, RoleplayReplyOut, RoleplaySummaryOut, WeeklyReportOut } from "./schemas";
import type { AiClient, AiResult, CheckInput, RoleplayInput } from "./types";

// Fake AI for development and tests (AI_MODE=mock, the default without an
// API key). It is NOT a French checker: it only catches two easy beginner
// mistakes (article gender, missing elision) so every screen and the
// fix → retype flow can be tried for free. Real checking needs Claude.

const VOWEL_START = /^[aeiouéèêàâîôûœ]/i;

function result<T>(data: T): AiResult<T> {
  return { data, usage: null, model: "mock", latencyMs: 0 };
}

function findNoun(content: Content, token: string): Word | undefined {
  const t = normalize(token);
  return content.words.find(
    // "m/f" nouns (le voisin / la voisine) take both articles, so skip them.
    (w) => w.pos === "noun" && (w.gender === "m" || w.gender === "f") && (normalize(w.french) === t || normalize(w.french) + "s" === t),
  );
}

export function mockMistakes(content: Content, sentence: string): Mistake[] {
  const mistakes: Mistake[] = [];

  for (const m of sentence.matchAll(/(^|[^\p{L}'])(un|une|le|la)\s+(\p{L}+)/giu)) {
    const [, , art, noun] = m;
    const word = findNoun(content, noun);
    if (!word || VOWEL_START.test(noun)) continue;
    const lower = art.toLowerCase();
    const indefinite = lower === "un" || lower === "une";
    const expected = indefinite ? (word.gender === "f" ? "une" : "un") : word.gender === "f" ? "la" : "le";
    if (lower !== expected) {
      const fixArt = art[0] === art[0].toUpperCase() ? expected[0].toUpperCase() + expected.slice(1) : expected;
      mistakes.push({
        tag: "article-gender",
        severity: "major",
        original: `${art} ${noun}`,
        fix: `${fixArt} ${noun}`,
        hint: `Is "${word.french}" masculine or feminine?`,
        short_explanation: `"${word.french}" is ${word.gender === "f" ? "feminine" : "masculine"}, so it takes "${expected}".`,
        detail: `Every French noun is masculine or feminine. Learn nouns with their article: "${word.article === "l'" ? (word.gender === "f" ? "la" : "le") : word.article} ${word.french}".`,
      });
    }
  }

  for (const m of sentence.matchAll(/(^|[^\p{L}'])(je|le|la|de|ne|que)\s+(\p{L}+)/giu)) {
    const [, , small, next] = m;
    if (!VOWEL_START.test(next)) continue;
    const fixed = `${small.slice(0, -1)}'${next}`;
    mistakes.push({
      tag: "elision",
      severity: "minor",
      original: `${small} ${next}`,
      fix: fixed,
      hint: `Look at "${small}" before a word that starts with a vowel.`,
      short_explanation: `"${small}" becomes "${small.slice(0, -1)}'" before a vowel.`,
      detail: `French drops the last vowel of small words like je, le, la, de, ne and que before a vowel sound: "${fixed}".`,
    });
  }
  return mistakes.slice(0, 2);
}

function applyFixes(sentence: string, mistakes: Mistake[]): string {
  let out = sentence;
  for (const m of mistakes) out = out.replace(m.original, m.fix);
  return out;
}

const ENCOURAGEMENTS = ["Nice work!", "Good sentence!", "Well done, keep going!", "Great effort!"];

export class MockAi implements AiClient {
  readonly mode = "mock" as const;
  constructor(private content: Content) {}

  async checkSentence(input: CheckInput): Promise<AiResult<RawFeedback>> {
    const mistakes = mockMistakes(this.content, input.sentence);
    const corrected = applyFixes(input.sentence, mistakes);
    const firstMini = input.word.mini_text.fr.split(/(?<=[.!?])\s+/)[0];
    const firstMiniEn = input.word.mini_text.en.split(/(?<=[.!?])\s+/)[0];
    return result({
      structure_ok: true,
      structure_note: "",
      is_question: /\?\s*$/.test(input.sentence),
      is_correct: mistakes.length === 0,
      corrected_sentence: corrected,
      mistakes,
      example_sentences: [
        { french: input.word.example, english: input.word.example_en },
        { french: firstMini, english: firstMiniEn },
      ],
      words_used: findWordsUsed(input.sentence, this.content.words).map((id) => this.content.wordById.get(id)!.french),
      encouragement: ENCOURAGEMENTS[input.sentence.length % ENCOURAGEMENTS.length],
    });
  }

  async coachNote(stats: CoachStats): Promise<AiResult<CoachNoteOut>> {
    const n = fallbackCoachNote(stats);
    return result({ headline: n.headline, message: n.message, focus_tag: n.focusTag ?? "", action_label: n.actionLabel });
  }

  async weeklyReport(stats: CoachStats): Promise<AiResult<WeeklyReportOut>> {
    const top = stats.topMistakes[0];
    return result({
      summary: `You practised ${stats.daysPracticedThisWeek} day(s) this week and can really use ${stats.wordsYouCanUse} words.`,
      wins: [
        `${stats.wordsYouCanUseThisWeek} word(s) used on your own this week`,
        `Streak: ${stats.streak} day(s)`,
      ],
      focus_tag: top?.tag ?? "",
      focus_reason: top ? `${top.title}: ${top.last14Days} mistake(s) in 2 weeks.` : "No repeating mistake yet.",
      next_steps: [
        top ? `Practise ${top.title.toLowerCase()} once this week.` : "Keep your daily practice.",
        stats.quietWords.length ? `Use ${stats.quietWords.slice(0, 2).join(" and ")} in a sentence.` : "Try a role-play.",
      ],
    });
  }

  async roleplayTurn(input: RoleplayInput): Promise<AiResult<RoleplayReplyOut>> {
    const lines: [string, string][] = [
      ["Très bien ! Et tu veux autre chose ?", "Very good! And do you want anything else?"],
      ["D'accord. Tu peux m'en dire plus ?", "Okay. Can you tell me more?"],
      ["Ah bon ? Pourquoi ?", "Really? Why?"],
      ["Super. Et après, qu'est-ce que tu fais ?", "Great. And after that, what do you do?"],
      ["Parfait, merci beaucoup !", "Perfect, thank you very much!"],
    ];
    const turns = input.messages.filter((m) => m.from === "learner").length;
    const [fr, en] = lines[(turns - 1 + lines.length) % lines.length];
    return result({ reply_fr: fr, reply_en: en, should_end: turns >= input.maxTurns });
  }

  async roleplaySummary(input: RoleplayInput): Promise<AiResult<RoleplaySummaryOut>> {
    const learner = input.messages.filter((m) => m.from === "learner").map((m) => m.fr);
    const corrections = learner.flatMap((s) =>
      mockMistakes(this.content, s).map((m) => ({ original: m.original, fix: m.fix, explanation: m.short_explanation, tag: m.tag })),
    );
    const used = new Set<string>();
    for (const s of learner) for (const id of findWordsUsed(s, this.content.words)) used.add(this.content.wordById.get(id)!.french);
    return result({
      overall: `You kept the conversation going for ${learner.length} turn(s). (Mock mode: real feedback needs the Claude API.)`,
      praise: learner.length ? "You answered every question in French." : "Try writing a few replies next time.",
      corrections: corrections.slice(0, 5),
      words_used: [...used],
    });
  }
}
