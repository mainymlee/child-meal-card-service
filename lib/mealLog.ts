import type { MealLogEntry, NutritionGroup } from "./types";

const MAX_ENTRIES = 7;

export function normalizeMealLog(values: unknown): MealLogEntry[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((value): MealLogEntry[] => {
    if (typeof value === "string") {
      return [{ grp: value as NutritionGroup, menuName: null, eatenAt: null }];
    }
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    if (typeof record.grp !== "string") return [];
    return [{
      grp: record.grp as NutritionGroup,
      menuName: typeof record.menuName === "string" ? record.menuName : null,
      eatenAt: typeof record.eatenAt === "string" ? record.eatenAt : null,
    }];
  }).slice(-MAX_ENTRIES);
}
