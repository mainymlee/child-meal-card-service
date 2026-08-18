import { PERSONA_HOME } from "./persona";
import {
  STORES,
  cheapestUnderBudgetItem,
  distanceMeters,
  isOpenNow,
} from "./stores";
import { nowInSeoul } from "./time";
import type { Store } from "./types";

export type SoloAnswer = "혼자" | "같이";
export type DineMode = "가게에서" | "포장" | "아무거나";

export type ChatStep = "ask_solo" | "ask_dine_mode" | "result";

export interface ChatMessage {
  id: string;
  from: "bot" | "me";
  text: string;
}

export interface Recommendation {
  storeId: string;
  storeName: string;
  menuName: string;
  price: number;
}

export interface ChatState {
  step: ChatStep;
  messages: ChatMessage[];
  quickReplies: string[];
  solo?: SoloAnswer;
  dineMode?: DineMode;
  recommendation?: Recommendation | null;
}

export type ChatAction =
  | { type: "ANSWER_SOLO"; value: SoloAnswer }
  | { type: "ANSWER_DINE_MODE"; value: DineMode };

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

export function recommendStore(
  stores: Store[],
  opts: { solo?: SoloAnswer; dineMode?: DineMode; now: Date }
): Recommendation | null {
  const openNow = stores.filter((s) => isOpenNow(s, opts.now));
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

  const ranked = [...candidates].sort((a, b) => {
    const itemA = cheapestUnderBudgetItem(a);
    const itemB = cheapestUnderBudgetItem(b);
    if (itemA.price !== itemB.price) return itemA.price - itemB.price;
    return (
      distanceMeters(PERSONA_HOME, a) - distanceMeters(PERSONA_HOME, b)
    );
  });

  const top = ranked[0];
  if (!top) return null;
  const item = cheapestUnderBudgetItem(top);
  return { storeId: top.id, storeName: top.name, menuName: item.name, price: item.price };
}

export function initialChatState(): ChatState {
  return {
    step: "ask_solo",
    messages: [
      bot("안녕! 지금 쓸 수 있어. 오늘 뭐 먹을지 같이 골라볼까?"),
      bot("혼자 먹어?"),
    ],
    quickReplies: ["혼자 먹어", "같이 먹어"],
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  const now = nowInSeoul();
  switch (action.type) {
    case "ANSWER_SOLO": {
      const messages = [
        ...state.messages,
        me(action.value === "혼자" ? "혼자 먹어" : "같이 먹어"),
        bot("가게에서 먹을래, 포장할래?"),
      ];
      return {
        ...state,
        step: "ask_dine_mode",
        solo: action.value,
        messages,
        quickReplies: ["가게에서", "포장", "아무거나"],
      };
    }
    case "ANSWER_DINE_MODE": {
      const recommendation = recommendStore(STORES, {
        solo: state.solo,
        dineMode: action.value,
        now,
      });

      const messages = [...state.messages, me(action.value)];
      if (recommendation) {
        messages.push(
          bot(
            `지금 열려 있고, ${
              state.solo === "혼자" ? "혼자 가도 편하고, " : ""
            }1만 원 안에 되는 곳을 찾았어.`
          )
        );
      } else {
        messages.push(bot("지금은 문 연 곳이 없어. 내일 다시 물어봐줘."));
      }

      return {
        ...state,
        step: "result",
        dineMode: action.value,
        recommendation,
        messages,
        quickReplies: [],
      };
    }
    default:
      return state;
  }
}
