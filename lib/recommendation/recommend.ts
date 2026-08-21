import { distanceMeters } from "@/lib/stores";
import type { Store } from "@/lib/types";
import { eligibleMenus, evaluateEligibility } from "./eligibility";
import { explainRecommendation } from "./explain";
import { dataConfidence, scoreCandidate, totalScore } from "./scorer";
import {
  RECOMMENDATION_ALGORITHM_VERSION,
  type RecommendationContext,
  type RecommendationResult,
} from "./types";

function hardBudget(context: RecommendationContext): number {
  return Math.min(
    context.spendingPlan.remainingBalance,
    context.spendingPlan.officialDailyLimit ?? Number.POSITIVE_INFINITY
  );
}

export function recommendMeals(
  stores: Store[],
  context: RecommendationContext,
  limit = 3
): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  for (const store of stores) {
    const distance = distanceMeters(context.location, store);
    if (!evaluateEligibility(store, context, distance).eligible) continue;
    if (context.serviceMode === "takeout" && !store.badges.takeoutAvailable) continue;
    if (context.diningMode === "solo" && !store.badges.soloFriendly) continue;

    const candidates = eligibleMenus(store, hardBudget(context));
    const scored = candidates.map((menu) => {
      const score = scoreCandidate(store, menu, distance, context);
      return { menu, score, total: totalScore(score) };
    }).sort((a, b) => b.total - a.total || a.menu.price - b.menu.price);
    const best = scored[0];
    if (!best) continue;

    results.push({
      algorithmVersion: RECOMMENDATION_ALGORITHM_VERSION,
      generatedAt: new Date().toISOString(),
      store,
      menuName: best.menu.name,
      estimatedPrice: best.menu.price,
      totalScore: best.total,
      score: best.score,
      reasons: explainRecommendation(
        best.score,
        best.menu.price,
        context.spendingPlan.dailyRecommended
      ),
      warnings: store.menuSource === "name-derived"
        ? ["가게명으로 추정한 메뉴와 가격이므로 방문 전 확인이 필요해요."]
        : ["업종으로 추정한 메뉴와 가격이므로 방문 전 확인이 필요해요."],
      relaxedConditions: [],
      dataConfidence: dataConfidence(store),
    });
  }

  return results.sort((a, b) => b.totalScore - a.totalScore).slice(0, limit);
}

