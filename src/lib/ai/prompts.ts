import fs from "node:fs";
import path from "node:path";
import type { GrammarRule } from "@/lib/content/types";
import { displayWord } from "@/lib/content/types";
import type { CoachStats } from "@/lib/learning/coach";
import type { CheckInput, RoleplayInput } from "./types";

// Builds the text sent to Claude. The instructions live in /prompts/*.md
// (Jerry owns them, edit those files, not this one). This file only adds the
// grammar rule set and the per-request data.
//
// Caching: the system text is identical for every request of a kind, so it
// is marked for prompt caching. Never put dates, names or random values in it.

const PROMPT_DIR = path.join(process.cwd(), "prompts");
const cache = new Map<string, string>();

export function loadPrompt(name: "check-sentence" | "coach" | "roleplay"): string {
  let text = cache.get(name);
  if (text === undefined) {
    text = fs.readFileSync(path.join(PROMPT_DIR, `${name}.md`), "utf8");
    cache.set(name, text);
  }
  return text;
}

export function grammarRulesBlock(rules: GrammarRule[]): string {
  const quote = (xs: string[]) => xs.map((x) => `"${x}"`).join(", ");
  const lines = rules.map((r) => {
    const head = `- ${r.id} (level ${r.level}${r.severity ? `, usually ${r.severity}` : ""}): ${r.title}. ${r.rule}`;
    const ex = r.examples ?? { wrong: r.wrong ? [r.wrong] : [], right: r.right ? [r.right] : [] };
    if (!ex.wrong.length && !ex.right.length) return head;
    return `${head} Wrong: ${quote(ex.wrong)} → Right: ${quote(ex.right)}`;
  });
  return ["## Grammar rule set", "Use these ids as mistake tags. Use \"other\" only if none fits.", ...lines].join("\n");
}

export function checkSystemPrompt(promptText: string, rules: GrammarRule[]): string {
  return `${promptText.trim()}\n\n${grammarRulesBlock(rules)}`;
}

/** Learner text is fenced and labelled as data, so it can't act as instructions. */
function fence(tag: string, text: string): string {
  const safe = text.replace(new RegExp(`</?${tag}>`, "gi"), "");
  return `<${tag}>\n${safe}\n</${tag}>`;
}

const GENDER_TEXT = {
  m: "masculine",
  f: "feminine",
  "m/f": "masculine or feminine depending on the person, both forms are correct",
} as const;

export function checkUserMessage(input: CheckInput): string {
  const w = input.word;
  const lines = [
    "Check the learner's item below and answer in the required JSON format.",
    "",
    "<task>",
    `level: ${input.level}`,
    `target_word: "${w.french}" (${w.pos}${w.gender ? `, ${GENDER_TEXT[w.gender]}` : ""}, shown as "${displayWord(w)}", means "${w.english}")`,
    `item_type: ${input.itemType}`,
    `template: ${input.templatePattern}`,
  ];
  if (input.templateExample) lines.push(`template_example: ${input.templateExample}`);
  if (input.focusTag) lines.push(`focus_rule: ${input.focusTag} (the learner is practising this rule; check it carefully)`);
  if (input.recentMistakeTags.length) lines.push(`recent_mistake_tags: ${input.recentMistakeTags.join(", ")}`);
  lines.push("</task>", "", fence("learner_sentence", input.sentence));
  return lines.join("\n");
}

export function coachSystemPrompt(promptText: string): string {
  return promptText.trim();
}

export function coachUserMessage(kind: "daily" | "weekly", stats: CoachStats): string {
  return [
    kind === "daily"
      ? "Write today's short coach note from these numbers."
      : "Write this week's progress report from these numbers.",
    "",
    "<learner_stats>",
    JSON.stringify(stats, null, 2),
    "</learner_stats>",
  ].join("\n");
}

export function roleplaySystemPrompt(promptText: string, rules: GrammarRule[]): string {
  return `${promptText.trim()}

${grammarRulesBlock(rules)}`;
}

function transcript(input: RoleplayInput): string {
  return input.messages
    .map((m) => (m.from === "ai" ? `YOU (${input.scenario.character}): ${m.fr}` : `LEARNER: ${m.fr}`))
    .join("\n");
}

function scenarioBlock(input: RoleplayInput): string {
  return [
    "<scenario>",
    `title: ${input.scenario.title}`,
    `setting: ${input.scenario.setting}`,
    `you_play: ${input.scenario.character}`,
    `learner_level: ${input.level}`,
    `week_words: ${input.weekWords.join(", ") || "(none yet)"}`,
    `max_learner_turns: ${input.maxTurns}`,
    "</scenario>",
  ].join("\n");
}

export function roleplayTurnMessage(input: RoleplayInput): string {
  const learnerTurns = input.messages.filter((m) => m.from === "learner").length;
  return [
    "Continue the role-play with your next reply.",
    scenarioBlock(input),
    `learner_turns_so_far: ${learnerTurns}`,
    fence("conversation", transcript(input)),
  ].join("\n\n");
}

export function roleplaySummaryMessage(input: RoleplayInput): string {
  return [
    "The role-play is over. Write the end-of-chat feedback for the learner.",
    scenarioBlock(input),
    fence("conversation", transcript(input)),
  ].join("\n\n");
}
