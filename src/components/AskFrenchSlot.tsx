import { getContext } from "@/lib/context";
import { AskFrench } from "./AskFrench";

/** The chat bubble, only for signed-in learners (it reads the user: keep it inside <Suspense>). */
export async function AskFrenchSlot() {
  const ctx = await getContext();
  return ctx.user ? <AskFrench /> : null;
}
