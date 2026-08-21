import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const cache = new Map();

function resolveLocal(specifier, parentFile) {
  const base = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : path.resolve(path.dirname(parentFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.json`]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function loadTypeScript(file) {
  if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
  if (cache.has(file)) return cache.get(file).exports;

  const loadedModule = { exports: {} };
  cache.set(file, loadedModule);
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const localRequire = (specifier) => {
    const resolved = resolveLocal(specifier, file);
    return resolved ? loadTypeScript(resolved) : nativeRequire(specifier);
  };
  new Function("require", "module", "exports", output)(
    localRequire,
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

const { spendingPaceScore } = loadTypeScript(
  path.join(root, "lib/recommendation/scorer.ts")
);
const { evaluateEligibility } = loadTypeScript(
  path.join(root, "lib/recommendation/eligibility.ts")
);
const { calcBalancePlan } = loadTypeScript(path.join(root, "lib/balance.ts"));
const { recommendMeals } = loadTypeScript(
  path.join(root, "lib/recommendation/recommend.ts")
);

const now = new Date(2026, 7, 21, 12, 0, 0);
const baseContext = {
  neighborhood: "후평동",
  spendingPlan: {
    remainingBalance: 90000,
    remainingDays: 10,
    dailyRecommended: 9000,
    recommendedUpperBound: 13000,
    officialDailyLimit: null,
    expiringAmount: 0,
    cycleEnd: "2026-08-31T14:59:59.999Z",
  },
  diningMode: "together",
  serviceMode: "any",
  now,
  hourOverride: null,
  location: { lat: 37.88, lng: 127.73, source: "dong-center" },
  mealHistory: [],
  feedback: [],
  preferences: {
    dislikedKeywords: [],
    allergyKeywords: [],
    spiceLevel: "normal",
    portion: "normal",
  },
  reports: {},
};

const store = {
  id: "test-store",
  name: "테스트 식당",
  category: "한식",
  cat2: "kr",
  grp: "백반·정식",
  neighborhood: "후평동",
  address: "춘천시 테스트로 1",
  phone: null,
  lat: 37.88,
  lng: 127.73,
  hours: { open: "09:00", close: "21:00" },
  closedDays: [],
  breakTime: null,
  hoursEst: true,
  counterDescription: "",
  badges: {
    soloFriendly: true,
    takeoutAvailable: true,
    paymentConfirmed: true,
    paymentConfirmedDate: null,
  },
  menu: [{ name: "백반", price: 9000, underBudget: true }],
  menuSource: "name-derived",
};

const tests = [
  ["지도 추천순은 오늘 권장액에 가까운 가게를 먼저 보여준다", () => {
    const cheaper = {
      ...store,
      id: "cheap-store",
      name: "저가 식당",
      menu: [{ name: "저가 백반", price: 5000, underBudget: true }],
    };
    const target = {
      ...store,
      id: "target-store",
      name: "권장액 식당",
      menu: [{ name: "권장액 백반", price: 9000, underBudget: true }],
    };
    const results = recommendMeals([cheaper, target], baseContext, 2);
    assert.equal(results[0].store.id, "target-store");
  }],
  ["잔액을 다시 입력하지 않으면 날짜가 지나도 하루 권장액이 커지지 않는다", () => {
    const updatedAt = new Date(2026, 7, 21, 12, 0, 0);
    const first = calcBalancePlan(90000, updatedAt, "month", updatedAt);
    const later = calcBalancePlan(
      90000,
      new Date(2026, 7, 24, 12, 0, 0),
      "month",
      updatedAt
    );
    assert.equal(later.dailyRecommended, first.dailyRecommended);
    assert.equal(later.recommendedUpperBound, first.recommendedUpperBound);
  }],
  ["하루 지원 기준과 AI 추천 상한은 1만원으로 고정한다", () => {
    const plan = calcBalancePlan(300000, now, "month", now);
    assert.equal(plan.dailyRecommended, 10000);
    assert.equal(plan.recommendedUpperBound, 10000);
    assert.ok(plan.dailySpendNeeded > 10000);
  }],
  ["사용 계획이 늦어지면 권장액 대신 소멸 예상액이 증가한다", () => {
    const updatedAt = new Date(2026, 7, 21, 12, 0, 0);
    const first = calcBalancePlan(90000, updatedAt, "month", updatedAt);
    const later = calcBalancePlan(
      90000,
      new Date(2026, 7, 24, 12, 0, 0),
      "month",
      updatedAt
    );
    assert.ok(later.expiringAmount > first.expiringAmount);
  }],
  ["오늘 권장액에 가까운 가격을 우선한다", () => {
    const target = spendingPaceScore(9000, baseContext);
    assert.ok(target > spendingPaceScore(5000, baseContext));
    assert.ok(target > spendingPaceScore(15000, baseContext));
  }],
  ["소멸 위험이 있으면 너무 낮은 지출을 더 감점한다", () => {
    const normal = spendingPaceScore(5000, baseContext);
    const expiring = spendingPaceScore(5000, {
      ...baseContext,
      spendingPlan: { ...baseContext.spendingPlan, expiringAmount: 5000 },
    });
    assert.ok(expiring < normal);
  }],
  ["정상 후보는 추천 가능하다", () => {
    assert.equal(evaluateEligibility(store, baseContext, 100).eligible, true);
  }],
  ["GPS 사용 중에는 선택 동네가 달라도 가까운 후보를 허용한다", () => {
    const otherNeighborhood = { ...store, neighborhood: "석사동" };
    const gpsContext = {
      ...baseContext,
      location: { ...baseContext.location, source: "gps" },
    };
    assert.equal(evaluateEligibility(otherNeighborhood, gpsContext, 100).eligible, true);
  }],
  ["남은 잔액보다 비싼 메뉴는 제외한다", () => {
    const context = {
      ...baseContext,
      spendingPlan: { ...baseContext.spendingPlan, remainingBalance: 5000 },
    };
    assert.ok(evaluateEligibility(store, context, 100).reasons.includes("over-budget"));
  }],
  ["메뉴가 확인되지 않은 가게는 제외한다", () => {
    const unknown = { ...store, menu: [], menuSource: "unverified" };
    assert.ok(evaluateEligibility(unknown, baseContext, 100).reasons.includes("unverified-menu"));
  }],
  ["결제 실패 신고가 누적된 가게는 제외한다", () => {
    const context = { ...baseContext, reports: { [store.id]: 2 } };
    assert.ok(evaluateEligibility(store, context, 100).reasons.includes("payment-pending"));
  }],
];

let passed = 0;
for (const [name, run] of tests) {
  run();
  passed += 1;
  console.log(`✓ ${name}`);
}
console.log(`AI v2 validation: ${passed}/${tests.length} passed`);
