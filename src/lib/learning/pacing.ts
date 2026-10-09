import type { ItemResult } from "./state";

// Adaptive pace (ROADMAP C5): accuracy decides how many NEW words a batch
// gets. Low accuracy → fewer new words and more practice of weak ones.

export const PACE_WINDOW = 15;

/** Share of recent items that were right on the first try, or null if too few. */
export function recentAccuracy(items: ItemResult[], window = PACE_WINDOW): number | null {
  const recent = items.slice(-window);
  if (recent.length < 5) return null;
  return recent.filter((i) => i.firstTryOk).length / recent.length;
}

export function newWordQuota(accuracy: number | null, batchSize: number): number {
  if (accuracy === null) return Math.min(2, batchSize);
  if (accuracy < 0.6) return Math.min(1, batchSize);
  if (accuracy < 0.85) return Math.min(2, batchSize);
  return batchSize;
}

export type PaceLabel = "slow" | "steady" | "fast" | "starting";

export function paceLabel(accuracy: number | null): PaceLabel {
  if (accuracy === null) return "starting";
  if (accuracy < 0.6) return "slow";
  if (accuracy < 0.85) return "steady";
  return "fast";
}
