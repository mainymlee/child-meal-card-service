import { GRP_BASE_SCORE } from "./taxonomy";
import { distanceMeters } from "./stores";
import { bestNutritionMenu, nutritionFitScore } from "./nutrition";
import type { MealFeedback, MealLogEntry, Store } from "./types";

export type VerificationStatus = "confirmed" | "unverified" | "pending";

export function reportCount(
  reports: Record<string, number>,
  storeId: string
): number {
  return reports[storeId] || 0;
}

export function verificationStatus(
  reports: Record<string, number>,
  store: Pick<Store, "id" | "badges">
): VerificationStatus {
  if (reportCount(reports, store.id) >= 2) return "pending";
  return store.badges.paymentConfirmed ? "confirmed" : "unverified";
}

interface NutritionScoreOptions {
  mealLog: MealLogEntry[];
  home: { lat: number; lng: number };
  reports: Record<string, number>;
  feedback?: MealFeedback[];
}

export function nutritionScore(store: Store, opts: NutritionScoreOptions): number {
  let score = GRP_BASE_SCORE[store.grp];
  const recentRepeats = opts.mealLog.filter((meal) => meal.grp === store.grp).length;
  score -= recentRepeats * 2;
  const feedback = opts.feedback ?? [];
  const menu = bestNutritionMenu(store, opts.mealLog, feedback);
  if (menu) score += nutritionFitScore(menu, store.grp, opts.mealLog, feedback);
  const distanceComplaints = feedback.filter((item) => item.reason === "distance").length;
  score -= (distanceMeters(opts.home, store) / 400) * (1 + Math.min(0.75, distanceComplaints * 0.15));
  feedback.slice(-20).forEach((item, index, items) => {
    const recency = 0.5 + (index + 1) / items.length;
    if (item.grp === store.grp) score += item.satisfaction * 1.2 * recency;
    if (item.storeId === store.id) score += item.satisfaction * 2 * recency;
  });
  if (menu) {
    const priceComplaints = feedback.filter((item) => item.reason === "price").length;
    score -= (menu.price / 5000) * Math.min(1.5, priceComplaints * 0.25);
  }
  if (verificationStatus(opts.reports, store) === "pending") score -= 6;
  return score;
}

export function rankStores(stores: Store[], opts: NutritionScoreOptions): Store[] {
  return [...stores].sort((a, b) => {
    const aPending = verificationStatus(opts.reports, a) === "pending";
    const bPending = verificationStatus(opts.reports, b) === "pending";
    if (aPending !== bPending) return aPending ? 1 : -1;
    return nutritionScore(b, opts) - nutritionScore(a, opts);
  });
}
