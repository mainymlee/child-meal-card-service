import welfareFile from "@/data/welfare.json";
import type { WelfareFile, WelfarePolicy } from "./types";

const DATA = welfareFile as WelfareFile;

export const WELFARE_PERSONA = DATA.persona;
export const WELFARE_POLICIES: WelfarePolicy[] = DATA.policies;

export function matchForPersona(
  personaTags: string[],
  policies: WelfarePolicy[] = WELFARE_POLICIES
): WelfarePolicy[] {
  return policies.filter((p) =>
    p.eligibility.some((tag) => personaTags.includes(tag))
  );
}
