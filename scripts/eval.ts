// AI grader test (ROADMAP B9). Run before changing prompts/check-sentence.md
// or CLAUDE_MODEL:   npm run eval
// It sends every sentence in tests/sentences.json to the sentence checker and
// compares the answer with the expected result. Uses real AI calls (costs a
// little money) when CLAUDE_API_KEY is set; otherwise runs on the mock.

import fs from "node:fs";
import path from "node:path";
import { getAi } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import { AI_PRICE_INPUT_PER_MTOK, AI_PRICE_OUTPUT_PER_MTOK, CLAUDE_MODEL } from "@/lib/config";
import { getContent } from "@/lib/content";
import { normalizeFeedback } from "@/lib/learning/feedback";

type TestItem = {
  id: string;
  level: number;
  word: string;
  type: "statement" | "question";
  template: string;
  sentence: string;
  expect: { structure_ok: boolean; is_correct: boolean | null; tags: string[][] };
};

async function main() {
  const content = getContent();
  const ai = getAi();
  const file = path.join(process.cwd(), "tests", "sentences.json");
  const items: TestItem[] = JSON.parse(fs.readFileSync(file, "utf8")).items;
  const knownTags = new Set(content.grammarRules.map((r) => r.id));
  const only = process.argv[2]; // npm run eval -- t05  (one test)

  console.log(`AI grader test · mode: ${ai.mode}${ai.mode === "claude" ? ` · model: ${CLAUDE_MODEL}` : " (mock: results are NOT meaningful)"}`);
  let passed = 0;
  let cost = 0;
  let ms = 0;
  const failures: string[] = [];

  for (const t of items.filter((i) => !only || i.id === only)) {
    const word = content.wordById.get(t.word)!;
    const template = content.structureById.get(t.template);
    const r = await ai.checkSentence({
      level: t.level,
      word,
      itemType: t.type,
      templatePattern: template?.pattern ?? "",
      templateExample: template ? (template.examples[word.pos]?.[1] ?? null) : null,
      sentence: t.sentence,
      focusTag: null,
      recentMistakeTags: [],
    });
    if (r.usage) cost += estimateCostUsd(r.usage, AI_PRICE_INPUT_PER_MTOK, AI_PRICE_OUTPUT_PER_MTOK);
    ms += r.latencyMs;
    const f = normalizeFeedback(r.data, { sentence: t.sentence, itemType: t.type, knownTags });
    const tags = f.mistakes.map((m) => m.tag);
    const problems: string[] = [];
    if (f.structure_ok !== t.expect.structure_ok) problems.push(`structure_ok ${f.structure_ok}, expected ${t.expect.structure_ok}`);
    if (t.expect.structure_ok && t.expect.is_correct !== null && f.is_correct !== t.expect.is_correct) {
      problems.push(`is_correct ${f.is_correct}, expected ${t.expect.is_correct}`);
    }
    for (const group of t.expect.tags) {
      if (!group.some((g) => tags.includes(g))) problems.push(`missing tag ${group.join(" or ")} (got ${tags.join(", ") || "none"})`);
    }
    if (problems.length === 0) {
      passed += 1;
      console.log(`  ✓ ${t.id}`);
    } else {
      console.log(`  ✗ ${t.id}  "${t.sentence}"\n      ${problems.join("\n      ")}\n      corrected: "${f.corrected_sentence}"`);
      failures.push(t.id);
    }
  }

  const total = only ? 1 : items.length;
  console.log(`\nPassed ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  if (failures.length) console.log(`Failed: ${failures.join(", ")}`);
  if (ai.mode === "claude") console.log(`Estimated cost: $${cost.toFixed(4)} · average ${Math.round(ms / total)} ms per check`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
