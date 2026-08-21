import { isOpenNow } from "@/lib/stores";
import type { Store } from "@/lib/types";
import type { RecommendationContext } from "./types";

export type IneligibilityReason =
  | "wrong-neighborhood"
  | "convenience-store"
  | "closed"
  | "unverified-menu"
  | "over-budget"
  | "allergy-keyword"
  | "disliked-keyword"
  | "payment-pending"
  | "too-far";

export interface EligibilityResult {
  eligible: boolean;
  reasons: IneligibilityReason[];
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

function menuContainsKeyword(store: Store, keywords: string[]): boolean {
  if (!keywords.length) return false;
  const searchable = normalize(
    [store.name, store.category, ...store.menu.map((menu) => menu.name)].join(" ")
  );
  return keywords.some((keyword) => {
    const normalized = normalize(keyword);
    return normalized.length > 0 && searchable.includes(normalized);
  });
}

export function evaluateEligibility(
  store: Store,
  context: RecommendationContext,
  distanceMeters: number
): EligibilityResult {
  const reasons: IneligibilityReason[] = [];
  const mealBudget = Math.min(
    context.spendingPlan.remainingBalance,
    context.spendingPlan.officialDailyLimit ?? context.spendingPlan.recommendedUpperBound
  );

  if (context.location.source === "dong-center" && store.neighborhood !== context.neighborhood) {
    reasons.push("wrong-neighborhood");
  }
  if (store.cat2 === "cvs") reasons.push("convenience-store");
  if (!isOpenNow(store, context.now, context.hourOverride)) reasons.push("closed");
  if (!store.menu.length || store.menuSource === "unverified") reasons.push("unverified-menu");
  if (!store.menu.some((menu) => menu.price <= mealBudget)) reasons.push("over-budget");
  if (menuContainsKeyword(store, context.preferences.allergyKeywords)) {
    reasons.push("allergy-keyword");
  }
  if (menuContainsKeyword(store, context.preferences.dislikedKeywords)) {
    reasons.push("disliked-keyword");
  }
  if ((context.reports[store.id] ?? 0) >= 2) reasons.push("payment-pending");
  if (
    context.preferences.maxWalkingMeters != null &&
    distanceMeters > context.preferences.maxWalkingMeters
  ) {
    reasons.push("too-far");
  }

  return { eligible: reasons.length === 0, reasons };
}

export function eligibleMenus(store: Store, budget: number) {
  return store.menu.filter((menu) => menu.price <= budget);
}
