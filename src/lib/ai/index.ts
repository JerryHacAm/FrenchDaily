import "server-only";
import { AI_MODE, CLAUDE_API_KEY, CLAUDE_EFFORT, CLAUDE_MODEL } from "@/lib/config";
import { getContent } from "@/lib/content";
import { ClaudeAi } from "./claude";
import { MockAi } from "./mock";
import type { AiClient } from "./types";

let ai: AiClient | null = null;

/** The AI used by the app: real Claude when CLAUDE_API_KEY is set, otherwise the mock. */
export function getAi(): AiClient {
  if (!ai) {
    const content = getContent();
    ai =
      AI_MODE === "claude"
        ? new ClaudeAi(content, { apiKey: CLAUDE_API_KEY, model: CLAUDE_MODEL, effort: CLAUDE_EFFORT })
        : new MockAi(content);
  }
  return ai;
}
