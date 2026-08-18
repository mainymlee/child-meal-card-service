import type { MealLogEntry, MenuItem, NutritionGroup, Store } from "./types";

export type NutritionLevel = "낮음" | "보통" | "높음";

export interface NutritionEstimate {
  protein: NutritionLevel;
  vegetables: NutritionLevel;
  carbs: NutritionLevel;
  sodium: NutritionLevel;
  sugar: NutritionLevel;
  fat: NutritionLevel;
  basis: "메뉴명 추정";
}

const LEVEL_VALUE: Record<NutritionLevel, number> = { 낮음: 0, 보통: 1, 높음: 2 };

function has(name: string, pattern: RegExp) {
  return pattern.test(name.replace(/\s/g, ""));
}

export function estimateNutrition(menuName: string, grp: NutritionGroup): NutritionEstimate {
  const protein = has(menuName, /고기|불고기|제육|닭|치킨|생선|참치|두부|계란|달걀|돈까스|돼지|소고기/)
    ? "높음" : grp === "백반·정식" || grp === "구이·볶음" ? "보통" : "낮음";
  const vegetables = has(menuName, /비빔|샐러드|채소|야채|나물|쌈|김밥/)
    ? "높음" : grp === "백반·정식" ? "보통" : "낮음";
  const carbs = has(menuName, /밥|면|라면|국수|떡|빵|피자|버거|김밥|덮밥/)
    ? "높음" : "보통";
  const sodium = has(menuName, /찌개|탕|국|라면|짬뽕|마라|조림|장|김치/)
    ? "높음" : grp === "국·찌개" || grp === "중식" || grp === "분식" ? "높음" : "보통";
  const sugar = has(menuName, /케이크|빵|도넛|와플|디저트|주스|음료|탕수육/)
    ? "높음" : grp === "베이커리" ? "높음" : "낮음";
  const fat = has(menuName, /튀김|치킨|돈까스|피자|버거|크림|탕수육/)
    ? "높음" : grp === "양식·돈까스" || grp === "중식" ? "보통" : "낮음";
  return { protein, vegetables, carbs, sodium, sugar, fat, basis: "메뉴명 추정" };
}

export function nutritionFitScore(menu: MenuItem, grp: NutritionGroup, history: MealLogEntry[]): number {
  const current = estimateNutrition(menu.name, grp);
  const recent = history.slice(-5).filter((meal) => meal.menuName).map((meal) =>
    estimateNutrition(meal.menuName!, meal.grp)
  );
  const sum = (key: keyof Omit<NutritionEstimate, "basis">) =>
    recent.reduce((total, item) => total + LEVEL_VALUE[item[key]], 0);
  let score = LEVEL_VALUE[current.protein] * 1.5 + LEVEL_VALUE[current.vegetables] * 2;
  if (recent.length && sum("protein") / recent.length < 1) score += LEVEL_VALUE[current.protein] * 2;
  if (recent.length && sum("vegetables") / recent.length < 1) score += LEVEL_VALUE[current.vegetables] * 2.5;
  if (recent.length && sum("sodium") / recent.length > 1.2) score -= LEVEL_VALUE[current.sodium] * 2;
  if (recent.length && sum("sugar") / recent.length > 0.8) score -= LEVEL_VALUE[current.sugar] * 1.5;
  score -= LEVEL_VALUE[current.sodium] * 0.7 + LEVEL_VALUE[current.sugar] * 0.6 + LEVEL_VALUE[current.fat] * 0.4;
  return score;
}

export function bestNutritionMenu(store: Store, history: MealLogEntry[]): MenuItem | undefined {
  const affordable = store.menu.filter((menu) => menu.underBudget);
  const pool = affordable.length ? affordable : store.menu;
  return [...pool].sort((a, b) =>
    nutritionFitScore(b, store.grp, history) - nutritionFitScore(a, store.grp, history) || a.price - b.price
  )[0];
}
