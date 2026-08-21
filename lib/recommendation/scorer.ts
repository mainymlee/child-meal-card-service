import { GRP_BASE_SCORE } from "@/lib/taxonomy";
import { estimateNutrition, nutritionFitScore } from "@/lib/nutrition";
import type { MenuItem, Store } from "@/lib/types";
import type {
  DataConfidence,
  RecommendationContext,
  RecommendationScoreBreakdown,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function dataConfidence(store: Store): DataConfidence {
  if (store.menuSource === "store-verified") return "high";
  if (store.menuSource === "brand-official" || store.menuSource === "name-derived") {
    return "medium";
  }
  return "low";
}

export function spendingPaceScore(
  price: number,
  context: RecommendationContext
): number {
  const { dailyRecommended, recommendedUpperBound, expiringAmount } =
    context.spendingPlan;
  if (dailyRecommended <= 0) return price === 0 ? 20 : -15;

  const relativeGap = Math.abs(price - dailyRecommended) / dailyRecommended;
  let score = 20 - relativeGap * 20;
  if (expiringAmount > 0 && price < dailyRecommended) {
    score -= ((dailyRecommended - price) / dailyRecommended) * 5;
  }
  if (recommendedUpperBound > 0 && price > recommendedUpperBound) {
    score -= ((price - recommendedUpperBound) / recommendedUpperBound) * 6;
  }
  return clamp(score, -15, 20);
}

function preferenceScore(store: Store, menu: MenuItem, context: RecommendationContext) {
  let score = 0;
  context.feedback.slice(-20).forEach((item, index, items) => {
    const recency = 0.5 + (index + 1) / items.length;
    if (item.menuName === menu.name) score += item.satisfaction * 2.2 * recency;
    if (item.grp === store.grp) score += item.satisfaction * 0.8 * recency;
    if (item.storeId === store.id) score += item.satisfaction * 1.4 * recency;
  });
  return clamp(score, -10, 10);
}

export function scoreCandidate(
  store: Store,
  menu: MenuItem,
  distance: number,
  context: RecommendationContext
): RecommendationScoreBreakdown {
  const repeats = context.mealHistory.filter((meal) => meal.grp === store.grp).length;
  const negative = context.feedback.filter(
    (item) => item.satisfaction < 0 && (item.storeId === store.id || item.grp === store.grp)
  ).length;
  const confidence = dataConfidence(store);
  const nutrition = nutritionFitScore(
    menu,
    store.grp,
    context.mealHistory,
    context.feedback
  );
  const nutritionEstimate = estimateNutrition(menu.name, store.grp);
  const priceRoom = context.spendingPlan.remainingBalance > 0
    ? 1 - menu.price / context.spendingPlan.remainingBalance
    : -1;

  return {
    spendingPace: spendingPaceScore(menu.price, context),
    base: GRP_BASE_SCORE[store.grp],
    nutrition: clamp(nutrition, -8, 12),
    preference: preferenceScore(store, menu, context),
    feedback: 0,
    budget: clamp(priceRoom * 2, -2, 2),
    distance: clamp(4 - distance / 400, -8, 4),
    confidence: confidence === "high" ? 4 : confidence === "medium" ? 0 : -3,
    repetitionPenalty: -clamp(repeats * 2, 0, 10),
    negativeFeedbackPenalty: -clamp(
      negative + (nutritionEstimate.sodium === "높음" && context.feedback.some((f) => f.reason === "spicy") ? 2 : 0),
      0,
      10
    ),
  };
}

export function totalScore(score: RecommendationScoreBreakdown): number {
  return Object.values(score).reduce((sum, value) => sum + value, 0);
}
