import "server-only";
import { getAi } from "@/lib/ai";
import { canUseBypass } from "@/lib/access";
import { AI_PRICE_INPUT_PER_MTOK, AI_PRICE_OUTPUT_PER_MTOK, RULES, TEST_BYPASS_CODE } from "@/lib/config";
import { getInviteList } from "@/lib/invites";
import { getContent } from "@/lib/content";
import { getContext, type AppUser } from "@/lib/context";
import type { Deps } from "@/lib/services/common";

/** The real dependencies for the signed-in user (null when not signed in). */
export async function appDeps(): Promise<{ deps: Deps; user: AppUser } | null> {
  const ctx = await getContext();
  if (!ctx.user) return null;
  return {
    user: ctx.user,
    deps: {
      userId: ctx.user.id,
      store: ctx.store,
      ai: getAi(),
      content: getContent(),
      rules: RULES,
      now: () => new Date(),
      rng: Math.random,
      newId: () => crypto.randomUUID(),
      prices: { inputPerMTok: AI_PRICE_INPUT_PER_MTOK, outputPerMTok: AI_PRICE_OUTPUT_PER_MTOK },
      bypassCode:
        TEST_BYPASS_CODE && canUseBypass(ctx.user.email, ctx.user.isAdmin, (await getInviteList()).emails) ? TEST_BYPASS_CODE : null,
    },
  };
}
