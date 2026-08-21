"use client";

import { useState } from "react";
import { getStoreById } from "@/lib/stores";
import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { logMeal } from "@/lib/hooks/useMealLog";
import { logMealFeedback } from "@/lib/hooks/useMealFeedback";
import type { FeedbackReason } from "@/lib/types";

const REASONS: { key: FeedbackReason; label: string }[] = [
  { key: "taste", label: "입맛에 안 맞았어요" },
  { key: "distance", label: "너무 멀었어요" },
  { key: "price", label: "가격이 부담됐어요" },
  { key: "portion", label: "양이 부족했어요" },
  { key: "spicy", label: "너무 자극적이었어요" },
  { key: "repeat", label: "비슷한 메뉴를 자주 먹었어요" },
];

export function VisitSheet({ storeId }: { storeId: string }) {
  const store = getStoreById(storeId);
  const { close } = useSheet();
  const { show } = useToast();
  const [menuName, setMenuName] = useState<string | null>(null);
  const [needsReason, setNeedsReason] = useState(false);
  if (!store) return null;

  const save = (satisfaction: -1 | 0 | 1, reason: FeedbackReason | null = null) => {
    if (!menuName) return;
    logMeal(store.grp, menuName);
    logMealFeedback({ storeId: store.id, grp: store.grp, menuName, satisfaction, reason });
    close();
    show("만족도를 기록했어요. 다음 추천부터 반영할게요");
  };

  if (needsReason) {
    return (
      <>
        <h3>어떤 점이 아쉬웠나요?</h3>
        <p className="desc">이유에 맞는 추천 기준만 조정할게요.</p>
        {REASONS.map((reason) => (
          <button key={reason.key} className="choice" onClick={() => save(-1, reason.key)}>
            {reason.label}
          </button>
        ))}
        <button className="skiplink" onClick={() => save(-1)}>이유 없이 저장</button>
      </>
    );
  }

  if (menuName) {
    return (
      <>
        <h3>{menuName}, 어땠어요?</h3>
        <p className="desc">평가는 이 브라우저의 다음 추천에만 사용해요.</p>
        <button className="choice" onClick={() => save(1)}>😍 만족했어요</button>
        <button className="choice" onClick={() => save(0)}>😐 보통이었어요</button>
        <button className="choice" onClick={() => setNeedsReason(true)}>😕 아쉬웠어요</button>
        <button className="skiplink" onClick={() => setMenuName(null)}>메뉴 다시 선택</button>
      </>
    );
  }

  return (
    <>
      <h3>다녀오셨어요? 뭐 드셨어요?</h3>
      <p className="desc">한 번만 눌러주면 다음 추천이 더 정확해져요.</p>
      {store.menu.slice(0, 4).map((menu) => (
        <button key={menu.name} className="choice" onClick={() => setMenuName(menu.name)}>
          {menu.name} 먹었어요
        </button>
      ))}
      <button className="skiplink" onClick={close}>
        다른 메뉴를 먹었어요 / 건너뛰기
      </button>
    </>
  );
}
