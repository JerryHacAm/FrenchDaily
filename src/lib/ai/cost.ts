import type { Usage } from "./types";

// Cost estimate in US dollars for one AI call. Prices come from .env
// (AI_PRICE_INPUT_PER_MTOK / AI_PRICE_OUTPUT_PER_MTOK). Cache writes cost
// 1.25x the input price and cache reads 0.1x (5-minute cache).
export function estimateCostUsd(usage: Usage, inputPerMTok: number, outputPerMTok: number): number {
  const input =
    usage.inputTokens * inputPerMTok +
    usage.cacheWriteTokens * inputPerMTok * 1.25 +
    usage.cacheReadTokens * inputPerMTok * 0.1;
  const output = usage.outputTokens * outputPerMTok;
  return (input + output) / 1_000_000;
}
