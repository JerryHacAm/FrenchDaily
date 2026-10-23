import { MAX_LEVEL, MIN_LEVEL } from "@/lib/learning/levels";
import type { LearnerGender } from "@/lib/learning/state";
import { fail, load, ok, save, userMessage, type Deps, type Result } from "./common";

// Welcome steps (ROADMAP C8: self-assessed starting level) and settings.

export type Profile = { name: string; level: number; gender: LearnerGender; onboarded: boolean; timezone: string };

export async function getProfile(deps: Deps): Promise<Profile> {
  const { state } = await load(deps);
  const p = state.profile;
  return { name: p.name, level: p.level, gender: p.gender ?? null, onboarded: p.onboarded, timezone: p.timezone };
}

export async function saveProfile(
  deps: Deps,
  input: { name: string; level: number; gender?: string | null; timezone?: string },
): Promise<Result<Profile>> {
  const name = input.name.trim().slice(0, 40);
  const level = Math.round(Number(input.level));
  const gender: LearnerGender = input.gender === "male" || input.gender === "female" ? input.gender : null;
  if (!name) return fail("Tell us your first name.");
  if (!(level >= MIN_LEVEL && level <= MAX_LEVEL)) return fail("Pick a level from 1 to 5.");
  try {
    const loaded = await load(deps, input.timezone);
    const p = loaded.state.profile;
    const today = loaded.today;
    const state = {
      ...loaded.state,
      profile: {
        ...p,
        name,
        level,
        gender,
        onboarded: true,
        levelChangedOn: level !== p.level ? today : p.levelChangedOn,
      },
    };
    await save(deps, loaded, state);
    return ok({ name, level, gender, onboarded: true, timezone: state.profile.timezone }, "Saved.");
  } catch (err) {
    return fail(userMessage(err));
  }
}
