import { rankStores } from "./ranking";
import { isOpenNow } from "./stores";
import { bestNutritionMenu } from "./nutrition";
import type { Dong, MealFeedback, MealLogEntry, Store } from "./types";

export type SoloAnswer = "혼자" | "같이";
export type DineMode = "가게에서" | "포장" | "아무거나";

export interface ChatMessage {
  id: string;
  from: "bot" | "me";
  text: string;
}

export interface QuickReply {
  key: string;
  label: string;
}

export interface Recommendation {
  storeId: string;
  storeName: string;
  menuName: string;
  price: number;
  reason?: string;
  source?: "local-ai";
}

export type ChatStep = "menu" | "ask_solo" | "ask_dine_mode" | "result";

export interface ChatState {
  step: ChatStep;
  messages: ChatMessage[];
  quickReplies: QuickReply[];
  solo?: SoloAnswer;
  dineMode?: DineMode;
  recommendation?: Recommendation | null;
}

export interface RecommendContext {
  stores: Store[];
  now: Date;
  hourOverride?: number | null;
  mealLog: MealLogEntry[];
  home: { lat: number; lng: number };
  reports: Record<string, number>;
  feedback?: MealFeedback[];
}

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}
function bot(text: string): ChatMessage {
  return { id: nextId(), from: "bot", text };
}
function me(text: string): ChatMessage {
  return { id: nextId(), from: "me", text };
}

export function recommendStore(ctx: RecommendContext, opts: { solo?: SoloAnswer; dineMode?: DineMode }): Recommendation | null {
  const openNow = ctx.stores.filter((s) =>
    isOpenNow(s, ctx.now, ctx.hourOverride) && s.cat2 !== "cvs" && s.menu.length > 0
  );
  if (!openNow.length) return null;

  let candidates = openNow;
  if (opts.dineMode === "포장") {
    candidates = candidates.filter((s) => s.badges.takeoutAvailable);
  }
  if (!candidates.length) candidates = openNow;

  if (opts.solo === "혼자") {
    const soloFriendly = candidates.filter((s) => s.badges.soloFriendly);
    if (soloFriendly.length) candidates = soloFriendly;
  }

  const ranked = rankStores(candidates, {
    mealLog: ctx.mealLog,
    home: ctx.home,
    reports: ctx.reports,
    feedback: ctx.feedback,
  });

  const top = ranked[0];
  if (!top) return null;
  const item = bestNutritionMenu(top, ctx.mealLog, ctx.feedback) ?? top.menu[0];
  return {
    storeId: top.id,
    storeName: top.name,
    menuName: item.name,
    price: item.price,
    reason: "영양 균형, 거리, 예산과 최근 식사 만족도를 함께 고려했어요.",
    source: "local-ai",
  };
}

function menuQuickReplies(hasOpenFood: boolean): QuickReply[] {
  return hasOpenFood
    ? [
        { key: "food", label: "오늘 뭐 먹지?" },
        { key: "cvs", label: "편의점 조합" },
        { key: "bal", label: "잔액 알려줘요" },
        { key: "wel", label: "받을 수 있는 혜택" },
      ]
    : [
        { key: "cvs", label: "편의점 조합 알려줘요" },
        { key: "bal", label: "잔액 알려줘요" },
      ];
}

export function initialChatState(ctx: RecommendContext): ChatState {
  const hasOpenFood = ctx.stores.some(
    (s) => s.cat2 !== "cvs" && isOpenNow(s, ctx.now, ctx.hourOverride)
  );
  return {
    step: "menu",
    messages: [
      bot(
        hasOpenFood
          ? "안녕하세요! 지금 밤 11시까지 카드를 쓸 수 있어요. 오늘 뭐 먹을지 같이 골라볼까요?"
          : "안녕하세요! 지금 밤 11시까지 카드를 쓸 수 있어요. 식당은 거의 닫힌 시간이에요 — 편의점 조합을 알려드릴까요?"
      ),
    ],
    quickReplies: menuQuickReplies(hasOpenFood),
  };
}

/** Rule-based (not LLM) free-text intent classifier for the chat composer. */
export function classifyFreeText(
  text: string
): "cvs" | "expiry" | "balance" | "food" | "welfare" | "dong" | "unknown" {
  if (/편의점|도시락|삼각김밥|컵라면/.test(text)) return "cvs";
  if (/이월|소멸|넘어가|사라지|규정/.test(text)) return "expiry";
  if (/잔액|얼마|남았|충전|한도/.test(text)) return "balance";
  if (/먹|배고|메뉴|추천|밥|점심|저녁|식당/.test(text)) return "food";
  if (/혜택|복지|지원|제도|급여/.test(text)) return "welfare";
  if (/동네|지역|위치|옮/.test(text)) return "dong";
  return "unknown";
}

export function chatReducer(
  state: ChatState,
  action: { key: string; label?: string },
  ctx: RecommendContext
): ChatState {
  const messages = [...state.messages];
  if (action.label) messages.push(me(action.label));

  switch (action.key) {
    case "food": {
      messages.push(bot("혼자 드세요?"));
      return {
        ...state,
        step: "ask_solo",
        messages,
        quickReplies: [
          { key: "solo1", label: "혼자 먹어요" },
          { key: "solo0", label: "같이 먹어요" },
        ],
      };
    }
    case "solo1":
    case "solo0": {
      const solo: SoloAnswer = action.key === "solo1" ? "혼자" : "같이";
      messages.push(bot("가게에서 드실래요, 포장하실래요?"));
      return {
        ...state,
        step: "ask_dine_mode",
        solo,
        messages,
        quickReplies: [
          { key: "eat", label: "가게에서요" },
          { key: "togo", label: "포장할래요" },
          { key: "any", label: "아무거나요" },
        ],
      };
    }
    case "eat":
    case "togo":
    case "any": {
      const dineMode: DineMode = action.key === "eat" ? "가게에서" : action.key === "togo" ? "포장" : "아무거나";
      const recommendation = recommendStore(ctx, { solo: state.solo, dineMode });
      if (!recommendation) {
        messages.push(
          bot(
            "지금 조건에 맞는 식당이 없어요. 대신 근처 편의점에서 균형 있게 조합하는 법을 알려드릴게요."
          )
        );
        return {
          ...state,
          step: "result",
          dineMode,
          recommendation: null,
          messages,
          quickReplies: [
            { key: "cvs", label: "편의점 조합 보기" },
            { key: "food", label: "조건 바꿔서 다시" },
          ],
        };
      }
      messages.push(
        bot(
          `지금 열려 있${state.solo === "혼자" ? "고, 혼자 가도 편하" : ""}고, 1만 원 안에 되는 곳을 찾았어요.`
        )
      );
      return {
        ...state,
        step: "result",
        dineMode,
        recommendation,
        messages,
        quickReplies: [
          { key: "map", label: "다른 곳도 볼래요" },
          { key: "cvs", label: "편의점 조합" },
          { key: "bal", label: "잔액 알려줘요" },
        ],
      };
    }
    case "bal": {
      messages.push(bot("잔액 화면에서 자세히 확인할 수 있어요."));
      return {
        ...state,
        messages,
        quickReplies: [
          { key: "goBal", label: "잔액 다시 입력할게요" },
          { key: "food", label: "오늘 뭐 먹지?" },
        ],
      };
    }
    case "wel": {
      messages.push(bot("조건에 맞는 복지 제도를 목록으로 보여드릴게요."));
      return {
        ...state,
        messages,
        quickReplies: [
          { key: "goWel", label: "혜택 목록 보기" },
          { key: "food", label: "오늘 뭐 먹지?" },
        ],
      };
    }
    default:
      return { ...state, messages };
  }
}

export function fallbackQuickReplies(): QuickReply[] {
  return [
    { key: "food", label: "오늘 뭐 먹지?" },
    { key: "cvs", label: "편의점 조합" },
    { key: "bal", label: "잔액 알려줘요" },
    { key: "wel", label: "받을 수 있는 혜택" },
  ];
}

export function dongQuickReplies(dongs: Dong[]): QuickReply[] {
  return dongs.map((d) => ({ key: `dong:${d}`, label: d }));
}
