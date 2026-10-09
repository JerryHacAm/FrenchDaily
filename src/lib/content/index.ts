import wordsFile from "../../../data/words.json";
import structuresFile from "../../../data/structures.json";
import rulesFile from "../../../data/grammar_rules.json";
import scenariosFile from "../../../data/roleplay_scenarios.json";
import { buildContent, type Content, type GrammarRule, type Scenario, type Structure, type Word } from "./types";
import { validateContent } from "./validate";

// Loads the content files from /data once. If a file has a mistake, the app
// stops with a list of problems (better than wrong behaviour later).

export function rawContent() {
  return {
    words: wordsFile.words as unknown as Word[],
    structures: structuresFile.structures as unknown as Structure[],
    grammarRules: rulesFile.rules as unknown as GrammarRule[],
    scenarios: scenariosFile.scenarios as unknown as Scenario[],
  };
}

let content: Content | null = null;

export function getContent(): Content {
  if (!content) {
    const raw = rawContent();
    const problems = validateContent(raw);
    if (problems.length) {
      throw new Error(`Content files have problems:\n- ${problems.join("\n- ")}`);
    }
    content = buildContent(raw);
  }
  return content;
}
