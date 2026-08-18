import { GRP_BASE_SCORE } from "./taxonomy";
import { distanceMeters } from "./stores";
import { bestNutritionMenu, nutritionFitScore } from "./nutrition";
import type { MealLogEntry, Store } from "./types";

export function reportCount(
  reports: Record<string, number>,
  storeId: string
): number {
  return reports[storeId] || 0;
}

export function verificationStatus(
  reports: Record<string, number>,
  storeId: string
): "ok" | "pending" {
  return reportCount(reports, storeId) >= 2 ? "pending" : "ok";
}

interface NutritionScoreOptions {
  mealLog: MealLogEntry[];
  home: { lat: number; lng: number };
  reports: Record<string, number>;
}

export function nutritionScore(store: Store, opts: NutritionScoreOptions): number {
  let score = GRP_BASE_SCORE[store.grp];
  const recentRepeats = opts.mealLog.filter((meal) => meal.grp === store.grp).length;
  score -= recentRepeats * 2;
  const menu = bestNutritionMenu(store, opts.mealLog);
  if (menu) score += nutritionFitScore(menu, store.grp, opts.mealLog);
  score -= distanceMeters(opts.home, store) / 400;
  if (verificationStatus(opts.reports, store.id) === "pending") score -= 6;
  return score;
}

export function rankStores(stores: Store[], opts: NutritionScoreOptions): Store[] {
  return [...stores].sort((a, b) => {
    const aPending = verificationStatus(opts.reports, a.id) === "pending";
    const bPending = verificationStatus(opts.reports, b.id) === "pending";
    if (aPending !== bPending) return aPending ? 1 : -1;
    return nutritionScore(b, opts) - nutritionScore(a, opts);
  });
}
