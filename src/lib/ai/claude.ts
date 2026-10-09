import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type * as z from "zod";
import type { Content } from "@/lib/content/types";
import type { CoachStats } from "@/lib/learning/coach";
import {
  checkSystemPrompt,
  checkUserMessage,
  coachSystemPrompt,
  coachUserMessage,
  loadPrompt,
  roleplaySummaryMessage,
  roleplaySystemPrompt,
  roleplayTurnMessage,
} from "./prompts";
import {
  CoachNoteSchema,
  FeedbackSchema,
  RoleplayReplySchema,
  RoleplaySummarySchema,
  WeeklyReportSchema,
} from "./schemas";
import { AiError, type AiClient, type AiResult, type CheckInput, type RoleplayInput, type Usage } from "./types";

// Real Claude API calls (server only). Model and effort come from .env
// (CLAUDE_MODEL, CLAUDE_EFFORT); never hardcode a model name here.

type Options = { apiKey: string; model: string; effort: "" | "low" | "medium" | "high" | "xhigh" | "max" };

const MAX_TOKENS = 8000; // room for adaptive thinking + a small JSON answer

export class ClaudeAi implements AiClient {
  readonly mode = "claude" as const;
  private client: Anthropic;

  constructor(
    private content: Content,
    private options: Options,
  ) {
    this.client = new Anthropic({ apiKey: options.apiKey });
  }

  private async call<S extends z.ZodType>(
    schema: S,
    system: string,
    user: string,
    attempt = 1,
  ): Promise<AiResult<z.infer<S>>> {
    const started = Date.now();
    try {
      const response = await this.client.messages.parse({
        model: this.options.model,
        max_tokens: MAX_TOKENS,
        // The system text never changes between requests of the same kind,
        // so it can be cached (cheaper and faster from the 2nd request on).
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
        output_config: {
          format: zodOutputFormat(schema),
          ...(this.options.effort ? { effort: this.options.effort } : {}),
        },
      });
      const usage: Usage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      };
      if (response.stop_reason === "refusal") {
        throw new AiError("refusal", "The AI couldn't check this one. Try writing a different sentence.");
      }
      const data = response.parsed_output;
      if (!data || response.stop_reason === "max_tokens") {
        if (attempt < 2) return this.call(schema, system, user, attempt + 1);
        throw new AiError(`unusable answer (${response.stop_reason})`, "The AI gave an answer we couldn't read. Please try again.");
      }
      return { data, usage, model: response.model, latencyMs: Date.now() - started };
    } catch (err) {
      if (err instanceof AiError) throw err;
      if (err instanceof Anthropic.AuthenticationError) {
        throw new AiError("auth", "The AI key is not valid. Tell quantrungvu to check CLAUDE_API_KEY.");
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new AiError("rate limit", "The AI is busy right now. Wait a minute and try again.");
      }
      if (err instanceof Anthropic.BadRequestError) {
        throw new AiError(`bad request: ${err.message}`, "The AI request was rejected. Tell quantrungvu (bad request).");
      }
      if (err instanceof Anthropic.APIError) {
        throw new AiError(`api error ${err.status}: ${err.message}`, "The AI service had a problem. Please try again.");
      }
      // Answer that didn't match the schema, network errors, etc.
      if (attempt < 2) return this.call(schema, system, user, attempt + 1);
      throw new AiError(String(err), "Couldn't reach the AI. Check your internet and try again.");
    }
  }

  checkSentence(input: CheckInput) {
    return this.call(
      FeedbackSchema,
      checkSystemPrompt(loadPrompt("check-sentence"), this.content.grammarRules),
      checkUserMessage(input),
    );
  }

  coachNote(stats: CoachStats) {
    return this.call(CoachNoteSchema, coachSystemPrompt(loadPrompt("coach")), coachUserMessage("daily", stats));
  }

  weeklyReport(stats: CoachStats) {
    return this.call(WeeklyReportSchema, coachSystemPrompt(loadPrompt("coach")), coachUserMessage("weekly", stats));
  }

  roleplayTurn(input: RoleplayInput) {
    return this.call(RoleplayReplySchema, roleplaySystemPrompt(loadPrompt("roleplay"), this.content.grammarRules), roleplayTurnMessage(input));
  }

  roleplaySummary(input: RoleplayInput) {
    return this.call(
      RoleplaySummarySchema,
      roleplaySystemPrompt(loadPrompt("roleplay"), this.content.grammarRules),
      roleplaySummaryMessage(input),
    );
  }
}
