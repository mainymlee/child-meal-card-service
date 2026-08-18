import { createPersistentState } from "./createPersistentState";
import type { NutritionGroup } from "@/lib/types";

const MAX_ENTRIES = 7;

const store = createPersistentState<NutritionGroup[]>("hanki:mealLog", []);

export const useMealLog = store.useValue;

export function logMeal(grp: NutritionGroup) {
  store.set((prev) => [...prev, grp].slice(-MAX_ENTRIES));
}
