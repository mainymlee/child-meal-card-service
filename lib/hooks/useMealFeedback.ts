import { createPersistentState } from "./createPersistentState";
import type { FeedbackReason, MealFeedback, NutritionGroup } from "@/lib/types";

const MAX_ENTRIES = 30;
const store = createPersistentState<MealFeedback[]>("hanki:mealFeedback", []);

export const useMealFeedback = store.useValue;

export function logMealFeedback(input: {
  storeId: string;
  grp: NutritionGroup;
  menuName: string;
  satisfaction: -1 | 0 | 1;
  reason?: FeedbackReason | null;
}) {
  store.set((previous) => [
    ...previous,
    { ...input, reason: input.reason ?? null, createdAt: new Date().toISOString() },
  ].slice(-MAX_ENTRIES));
}
