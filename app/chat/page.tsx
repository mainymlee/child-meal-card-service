"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { TabBar } from "@/components/layout/TabBar";
import { SendIcon } from "@/components/icons";
import { StoreBadgePills } from "@/components/Pill";
import { ExpirySheet } from "@/components/sheets/ExpirySheet";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import {
  chatReducer,
  classifyFreeText,
  dongQuickReplies,
  fallbackQuickReplies,
  initialChatState,
  recommendStore,
  type ChatMessage,
  type DineMode,
  type Recommendation,
  type RecommendContext,
} from "@/lib/chatEngine";
import { dongCenter } from "@/lib/persona";
import { NEIGHBORHOODS } from "@/lib/taxonomy";
import { getStoreById, isOpenNow, storesInDong } from "@/lib/stores";
import { verificationStatus } from "@/lib/ranking";
import { nowInSeoul } from "@/lib/time";
import { DEFAULT_DONG, setDong, useDong } from "@/lib/hooks/useDong";
import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useMealLog } from "@/lib/hooks/useMealLog";
import { useMealFeedback } from "@/lib/hooks/useMealFeedback";
import { useReports } from "@/lib/hooks/useReports";
import type { Dong } from "@/lib/types";

let idCounter = 0;
function makeMessage(from: "bot" | "me", text: string): ChatMessage {
  idCounter += 1;
  return { id: `p${idCounter}`, from, text };
}

export default function ChatPage() {
  const router = useRouter();
  const { open } = useSheet();
  const dong = useDong() ?? DEFAULT_DONG;
  const { hourOverride } = useDemoHour();
  const mealLog = useMealLog();
  const feedback = useMealFeedback();
  const reports = useReports();
  const now = useMemo(() => nowInSeoul(), []);

  const ctx: RecommendContext = useMemo(
    () => ({
      stores: storesInDong(dong),
      now,
      hourOverride,
      mealLog,
      home: dongCenter(dong),
      reports,
      feedback,
    }),
    [dong, now, hourOverride, mealLog, reports, feedback]
  );

  const [state, setState] = useState(() => initialChatState(ctx));
  const [input, setInput] = useState("");
  const [isRecommending, setIsRecommending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [state.messages]);

  const appendAndReply = (userText: string, botText: string, quickReplies: { key: string; label: string }[]) => {
    setState((s) => ({
      ...s,
      messages: [...s.messages, makeMessage("me", userText), makeMessage("bot", botText)],
      quickReplies,
    }));
  };

  const requestAiRecommendation = async (key: "eat" | "togo" | "any", label: string) => {
    const dineMode: DineMode = key === "eat" ? "가게에서" : key === "togo" ? "포장" : "아무거나";
    const solo = state.solo;
    setIsRecommending(true);
    setState((current) => ({
      ...current,
      dineMode,
      messages: [...current.messages, makeMessage("me", label), makeMessage("bot", "AI가 지금 가장 잘 맞는 한 끼를 고르고 있어요…")],
      quickReplies: [],
    }));

    let recommendation: Recommendation | null = null;
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dong, solo, dineMode, mealLog, feedback, reports, hourOverride }),
      });
      if (!response.ok) throw new Error(`recommendation ${response.status}`);
      const data = await response.json() as { recommendation?: Recommendation };
      recommendation = data.recommendation ?? null;
    } catch {
      recommendation = recommendStore(ctx, { solo, dineMode });
    }

    setState((current) => {
      const withoutLoading = current.messages.slice(0, -1);
      if (!recommendation) {
        return {
          ...current,
          step: "result",
          recommendation: null,
          messages: [...withoutLoading, makeMessage("bot", "지금 조건에 맞는 식당이 없어요. 근처 편의점 조합을 확인해볼까요?")],
          quickReplies: [
            { key: "cvs", label: "편의점 조합 보기" },
            { key: "food", label: "조건 바꿔서 다시" },
          ],
        };
      }
      const intro = recommendation.source === "ai"
        ? `AI 추천이에요. ${recommendation.reason}`
        : `AI 연결이 원활하지 않아 기본 추천을 보여드려요. ${recommendation.reason}`;
      return {
        ...current,
        step: "result",
        recommendation,
        messages: [...withoutLoading, makeMessage("bot", intro)],
        quickReplies: [
          { key: "map", label: "다른 곳도 볼래요" },
          { key: "cvs", label: "편의점 조합" },
          { key: "bal", label: "잔액 알려줘요" },
        ],
      };
    });
    setIsRecommending(false);
  };

  const handleQuick = (key: string, label: string) => {
    if (isRecommending) return;
    if (key === "eat" || key === "togo" || key === "any") {
      void requestAiRecommendation(key, label);
      return;
    }
    if (key === "map") {
      router.push("/result");
      return;
    }
    if (key === "cvs") {
      router.push("/cvs");
      return;
    }
    if (key === "goBal") {
      router.push("/balance");
      return;
    }
    if (key === "goWel") {
      router.push("/welfare");
      return;
    }
    if (key === "expInfo") {
      open(<ExpirySheet />);
      return;
    }
    if (key.startsWith("dong:")) {
      const next = key.slice(5) as Dong;
      setDong(next);
      appendAndReply(
        label,
        `${next} 기준으로 바꿨어요. 이제 그 동네 가게를 보여드릴게요.`,
        [
          { key: "food", label: "오늘 뭐 먹지?" },
          { key: "cvs", label: "편의점 조합" },
        ]
      );
      return;
    }
    setState((s) => chatReducer(s, { key, label }, ctx));
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const kind = classifyFreeText(text);
    if (kind === "cvs") {
      router.push("/cvs");
      return;
    }
    if (kind === "expiry") {
      appendAndReply(
        text,
        "좋은 질문이에요! 지역마다 달라요. 경기도는 월말 잔액이 다음 달로 이월되고 12월 말에 소멸돼요. 춘천시는 공식 안내에 이월 여부가 없어서, 보육아동과(033-250-3686) 확인 전까지는 매월 다 쓰는 기준으로 계산하고 있어요.",
        [
          { key: "expInfo", label: "규정 자세히 보기" },
          { key: "bal", label: "잔액 알려줘요" },
        ]
      );
      return;
    }
    if (kind === "dong") {
      setState((s) => ({
        ...s,
        messages: [...s.messages, makeMessage("me", text), makeMessage("bot", "어느 동네로 바꿀까요?")],
        quickReplies: dongQuickReplies(NEIGHBORHOODS),
      }));
      return;
    }
    if (kind === "unknown") {
      appendAndReply(text, "제가 도울 수 있는 건 이런 것들이에요 — 골라주세요!", fallbackQuickReplies());
      return;
    }
    const key = kind === "balance" ? "bal" : kind === "welfare" ? "wel" : "food";
    setState((s) => chatReducer(s, { key, label: text }, ctx));
  };

  const recommendedStore = state.recommendation ? getStoreById(state.recommendation.storeId) : null;

  return (
    <>
      <NavBar title="한끼 도우미" backHref="/home" />

      <div className="screenBody chatmain" ref={bodyRef}>
        <div className="chat">
          {state.messages.map((m) => (
            m.from === "bot" ? (
              <div key={m.id} className="botrow fade">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="botava" src="/app-logo.png" alt="" />
                <div>
                  <p className="botname">한끼</p>
                  <div className="msg bot">{m.text}</div>
                </div>
              </div>
            ) : (
              <div key={m.id} className="msg me fade">
                {m.text}
              </div>
            )
          ))}

          {state.quickReplies.length > 0 ? (
            <div className="quick">
              {state.quickReplies.map((q) => (
                <button key={q.key} disabled={isRecommending} onClick={() => handleQuick(q.key, q.label)}>
                  {q.label}
                </button>
              ))}
            </div>
          ) : null}

          {recommendedStore ? (
            <button className="reccard" onClick={() => router.push(`/store/${recommendedStore.id}`)}>
              <div style={{ marginBottom: 8 }}>
                <StoreBadgePills
                  openNow={isOpenNow(recommendedStore, now, hourOverride)}
                  isCvs={false}
                  soloFriendly={recommendedStore.badges.soloFriendly}
                  takeoutAvailable={recommendedStore.badges.takeoutAvailable}
                  verification={verificationStatus(reports, recommendedStore.id)}
                />
              </div>
              <p className="nm" style={{ margin: "0 0 2px" }}>
                {recommendedStore.name} · {state.recommendation!.menuName}
              </p>
              {state.recommendation?.source === "ai" ? (
                <p className="mt" style={{ margin: "0 0 3px" }}>AI 맞춤 추천</p>
              ) : null}
              <p className="mt" style={{ margin: "0 0 9px" }}>
                {state.recommendation!.price.toLocaleString()}원
              </p>
              <span className="btn sm">자세히 보기</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="composer">
        <input
          placeholder="무엇이든 물어보세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          aria-label="메시지 입력"
        />
        <button className="send" aria-label="보내기" onClick={handleSend}>
          <SendIcon size={17} />
        </button>
      </div>
      <TabBar />
    </>
  );
}
