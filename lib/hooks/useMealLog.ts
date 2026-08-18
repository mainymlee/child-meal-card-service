import { createPersistentState } from "./createPersistentState";
import { useMemo } from "react";
import type { MealLogEntry, NutritionGroup } from "@/lib/types";
import { normalizeMealLog } from "@/lib/mealLog";

const MAX_ENTRIES = 7;

type StoredMeal = NutritionGroup | MealLogEntry;
const store = createPersistentState<StoredMeal[]>("hanki:mealLog", []);

export function useMealLog(): MealLogEntry[] {
  const values = store.useValue();
  return useMemo(() => normalizeMealLog(values), [values]);
}

export function logMeal(grp: NutritionGroup, menuName: string | null = null) {
  store.set((prev) => [
    ...prev,
    { grp, menuName, eatenAt: new Date().toISOString() },
  ].slice(-MAX_ENTRIES));
}
