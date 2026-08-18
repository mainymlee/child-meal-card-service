import welfareFile from "@/data/welfare.json";
import type { Profile, WelfareFile, WelfarePolicy } from "./types";

const DATA = welfareFile as WelfareFile;

export const WELFARE_PERSONA = DATA.persona;
export const WELFARE_POLICIES: WelfarePolicy[] = DATA.policies;

// data/welfare.json's eligibility tags predate the editable Profile model and
// use "수급가구" where the profile option is labeled "기초생활수급" — alias it
// here rather than renaming the committed welfare data.
const FAMILY_TYPE_ALIASES: Record<string, string> = {
  기초생활수급: "수급가구",
};

export function profileToTags(profile: Profile): string[] {
  const tags = [profile.familyType, "아동", profile.schoolLevel];
  const alias = FAMILY_TYPE_ALIASES[profile.familyType];
  if (alias) tags.push(alias);
  return tags;
}

export function matchForPersona(
  personaTags: string[],
  policies: WelfarePolicy[] = WELFARE_POLICIES
): WelfarePolicy[] {
  return policies.filter((p) =>
    p.eligibility.some((tag) => personaTags.includes(tag))
  );
}
