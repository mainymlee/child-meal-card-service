"use client";

import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { TabBar } from "@/components/layout/TabBar";
import { SendIcon } from "@/components/icons";
import { StoreBadgePills } from "@/components/Pill";
import {
  chatReducer,
  initialChatState,
  type ChatAction,
  type DineMode,
  type SoloAnswer,
} from "@/lib/chatEngine";
import { getStoreById, isOpenNow } from "@/lib/stores";

export default function ChatPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(chatReducer, undefined, initialChatState);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [state.messages]);

  const handleQuickReply = (label: string) => {
    if (state.step === "ask_solo") {
      const value: SoloAnswer = label === "혼자 먹어" ? "혼자" : "같이";
      dispatch({ type: "ANSWER_SOLO", value } as ChatAction);
    } else if (state.step === "ask_dine_mode") {
      dispatch({ type: "ANSWER_DINE_MODE", value: label as DineMode } as ChatAction);
    }
  };

  const recommendedStore = state.recommendation
    ? getStoreById(state.recommendation.storeId)
    : null;

  return (
    <>
      <NavBar title="한끼 도우미" backHref="/" />

      <div className="screenBody" ref={bodyRef}>
        <div className="chat">
          {state.messages.map((m) => (
            <div key={m.id} className={`msg ${m.from === "me" ? "me" : "bot"}`}>
              {m.text}
            </div>
          ))}

          {state.quickReplies.length > 0 ? (
            <div className="quick">
              {state.quickReplies.map((label) => (
                <button key={label} onClick={() => handleQuickReply(label)}>
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          {recommendedStore ? (
            <button
              className="reccard"
              onClick={() => router.push(`/store/${recommendedStore.id}`)}
            >
              <div style={{ marginBottom: 8 }}>
                <StoreBadgePills
                  openNow={isOpenNow(recommendedStore, new Date())}
                  soloFriendly={recommendedStore.badges.soloFriendly}
                  takeoutAvailable={recommendedStore.badges.takeoutAvailable}
                  paymentConfirmed={false}
                />
              </div>
              <p className="nm" style={{ margin: "0 0 2px" }}>
                {recommendedStore.name} · {state.recommendation!.menuName}
              </p>
              <p className="mt" style={{ margin: "0 0 9px" }}>
                {state.recommendation!.price.toLocaleString()}원
              </p>
              <span className="btn sm">자세히 보기</span>
            </button>
          ) : null}

          {state.step === "result" ? (
            <div className="quick" style={{ marginTop: 4 }}>
              <button onClick={() => router.push("/result")}>다른 곳도 볼래</button>
              <button onClick={() => router.push("/balance")}>잔액 알려줘</button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="composer">
        <div className="inp">메시지 입력…</div>
        <button className="send" aria-label="보내기" disabled>
          <SendIcon size={17} />
        </button>
      </div>
      <TabBar />
    </>
  );
}
