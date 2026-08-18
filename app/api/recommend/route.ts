import { dongCenter } from "@/lib/persona";
import { rankStores } from "@/lib/ranking";
import { isOpenNow, storesInDong, walkingMinutes, distanceMeters } from "@/lib/stores";
import { NEIGHBORHOODS } from "@/lib/taxonomy";
import { nowInSeoul } from "@/lib/time";
import type { DineMode, Recommendation, SoloAnswer } from "@/lib/chatEngine";
import type { Dong, NutritionGroup } from "@/lib/types";

export const runtime = "nodejs";

type RecommendBody = {
  dong?: unknown;
  solo?: unknown;
  dineMode?: unknown;
  mealLog?: unknown;
  reports?: unknown;
  hourOverride?: unknown;
};

const NUTRITION_GROUPS: NutritionGroup[] = [
  "백반·정식", "국·찌개", "구이·볶음", "분식", "중식",
  "베이커리", "일식", "양식·돈까스", "편의점", "기타",
];

function isSolo(value: unknown): value is SoloAnswer {
  return value === "혼자" || value === "같이";
}

function isDineMode(value: unknown): value is DineMode {
  return value === "가게에서" || value === "포장" || value === "아무거나";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: RecommendBody;
  try {
    body = (await request.json()) as RecommendBody;
  } catch {
    return jsonError("요청 형식이 올바르지 않습니다.", 400);
  }

  if (!NEIGHBORHOODS.includes(body.dong as Dong) || !isSolo(body.solo) || !isDineMode(body.dineMode)) {
    return jsonError("추천 조건이 올바르지 않습니다.", 400);
  }

  const dong = body.dong as Dong;
  const mealLog = Array.isArray(body.mealLog)
    ? body.mealLog.filter((item): item is NutritionGroup => NUTRITION_GROUPS.includes(item as NutritionGroup)).slice(-12)
    : [];
  const rawReports = body.reports && typeof body.reports === "object" ? body.reports as Record<string, unknown> : {};
  const reports = Object.fromEntries(
    Object.entries(rawReports).slice(0, 2000).map(([id, count]) => [id, Math.max(0, Math.min(99, Number(count) || 0))])
  );
  const hourOverride = typeof body.hourOverride === "number" && body.hourOverride >= 0 && body.hourOverride <= 24
    ? body.hourOverride
    : null;

  const now = nowInSeoul();
  const openStores = storesInDong(dong).filter((store) =>
    store.cat2 !== "cvs" && isOpenNow(store, now, hourOverride)
  );
  if (!openStores.length) return jsonError("지금 영업 중인 식당이 없습니다.", 404);

  let eligible = openStores;
  if (body.dineMode === "포장") {
    const takeout = eligible.filter((store) => store.badges.takeoutAvailable);
    if (takeout.length) eligible = takeout;
  }
  if (body.solo === "혼자") {
    const solo = eligible.filter((store) => store.badges.soloFriendly);
    if (solo.length) eligible = solo;
  }

  const home = dongCenter(dong);
  const candidates = rankStores(eligible, { mealLog, home, reports }).slice(0, 12).map((store) => ({
    storeId: store.id,
    storeName: store.name,
    nutritionGroup: store.grp,
    walkingMinutes: walkingMinutes(distanceMeters(home, store)),
    soloFriendly: store.badges.soloFriendly,
    takeoutAvailable: store.badges.takeoutAvailable,
    paymentReports: reports[store.id] ?? 0,
    menus: store.menu.filter((menu) => menu.underBudget).slice(0, 6).map((menu) => ({
      name: menu.name,
      price: menu.price,
    })),
  })).filter((store) => store.menus.length > 0);

  if (!candidates.length) return jsonError("예산 안에서 추천할 메뉴가 없습니다.", 404);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError("AI 추천이 아직 설정되지 않았습니다.", 503);

  try {
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECOMMEND_MODEL || "gpt-5-mini",
        instructions: [
          "당신은 아동급식카드 사용자를 돕는 메뉴 추천 도우미입니다.",
          "반드시 제공된 후보의 storeId와 menuName 중 하나만 고르세요.",
          "예산 준수, 결제 신뢰도, 이동 거리, 최근 식사와 다른 영양군을 우선하세요.",
          "건강 효능을 단정하지 말고, 이유는 따뜻한 한국어 한 문장(80자 이내)으로 쓰세요.",
        ].join("\n"),
        input: JSON.stringify({
          preferences: { dong, solo: body.solo, dineMode: body.dineMode, recentMeals: mealLog },
          candidates,
        }),
        text: {
          format: {
            type: "json_schema",
            name: "meal_recommendation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                storeId: { type: "string" },
                menuName: { type: "string" },
                reason: { type: "string" },
              },
              required: ["storeId", "menuName", "reason"],
            },
          },
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!aiResponse.ok) throw new Error(`OpenAI ${aiResponse.status}`);
    const result = await aiResponse.json() as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const outputText = result.output_text ?? result.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("AI response text missing");

    const selected = JSON.parse(outputText) as { storeId?: string; menuName?: string; reason?: string };
    const store = candidates.find((candidate) => candidate.storeId === selected.storeId);
    const menu = store?.menus.find((item) => item.name === selected.menuName);
    if (!store || !menu) throw new Error("AI selected an unknown candidate");

    const recommendation: Recommendation = {
      storeId: store.storeId,
      storeName: store.storeName,
      menuName: menu.name,
      price: menu.price,
      reason: (selected.reason || "지금 조건에 잘 맞는 한 끼예요.").slice(0, 100),
      source: "ai",
    };
    return Response.json({ recommendation });
  } catch (error) {
    console.error("AI recommendation failed", error);
    return jsonError("AI 추천을 불러오지 못했습니다.", 502);
  }
}
