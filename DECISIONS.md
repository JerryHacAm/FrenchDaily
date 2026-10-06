# Decisions

## 2026-10-06 — Words picked by code from a curated list, not by AI
Why: AI is unreliable at randomness and can serve words too hard for beginners.
Revisit if: the curated list feels stale or too small.

## 2026-10-06 — Test mode: unlimited words; production: 5 per day
Why: Jerry is testing the app first. Streak needs at least 5 completed words
(STREAK_MIN_WORDS). Switched by APP_MODE env var.
Revisit if: we decide on the production rules or launch publicly.

## 2026-10-06 — Test mode check cap of 50 per day
Why: unlimited words means unlimited Claude API cost.
Revisit if: the cap blocks normal testing.