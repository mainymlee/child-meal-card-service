"use client";

import { getStoreById } from "@/lib/stores";
import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { logMeal } from "@/lib/hooks/useMealLog";

export function VisitSheet({ storeId }: { storeId: string }) {
  const store = getStoreById(storeId);
  const { close } = useSheet();
  const { show } = useToast();
  if (!store) return null;

  const record = (grp: typeof store.grp) => {
    logMeal(grp);
    close();
    show("기록했어요 — 다음 추천에 반영할게요");
  };

  return (
    <>
      <h3>다녀오셨어요? 뭐 드셨어요?</h3>
      <p className="desc">한 번만 눌러주면 다음 추천이 더 정확해져요.</p>
      <button className="choice" onClick={() => record(store.grp)}>
        추천받은 메뉴 먹었어요
      </button>
      <button className="choice" onClick={() => record("기타")}>
        다른 걸 먹었어요
      </button>
      <button className="skiplink" onClick={close}>
        안 갔어요 / 건너뛰기
      </button>
    </>
  );
}
