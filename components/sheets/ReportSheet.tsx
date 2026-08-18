"use client";

import { dongCenter } from "@/lib/persona";
import { rankStores } from "@/lib/ranking";
import { distanceMeters, getStoreById, isOpenNow, storesInDong } from "@/lib/stores";
import { nowInSeoul } from "@/lib/time";
import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { useMealLog } from "@/lib/hooks/useMealLog";
import { useMealFeedback } from "@/lib/hooks/useMealFeedback";
import { useReports, reportStore } from "@/lib/hooks/useReports";
import { StoreRow } from "@/components/StoreRow";
import { verificationStatus } from "@/lib/ranking";
import type { Dong } from "@/lib/types";

export function ReportSheet({
  storeId,
  dong,
  onNavigate,
}: {
  storeId: string;
  dong: Dong;
  onNavigate: (id: string) => void;
}) {
  const store = getStoreById(storeId);
  const mealLog = useMealLog();
  const feedback = useMealFeedback();
  const reports = useReports();
  const { close } = useSheet();
  const { show } = useToast();
  if (!store) return null;

  const now = nowInSeoul();
  const home = dongCenter(dong);
  const alt = rankStores(
    storesInDong(dong).filter((s) => s.id !== storeId && isOpenNow(s, now)),
    { mealLog, home, reports, feedback }
  )[0];

  const confirm = () => {
    reportStore(storeId);
    close();
    show("접수했어요 — 확인 중 배지로 바뀌고 추천에서 뒤로 밀려요");
  };

  return (
    <>
      <h3>알려주셔서 고마워요</h3>
      <p className="desc">
        <b>{store.name}</b>에서 결제가 안 됐군요. 확인이 끝날 때까지 이 가게는 추천에서
        뒤로 미뤄둘게요. 잘못한 게 아니에요.
      </p>
      {alt ? (
        <>
          <p className="lbl">대신 여기는 어때요?</p>
          <StoreRow
            store={alt}
            distance={distanceMeters(home, alt)}
            openNow={isOpenNow(alt, now)}
            verification={verificationStatus(reports, alt.id)}
            onClick={() => {
              close();
              onNavigate(alt.id);
            }}
          />
        </>
      ) : null}
      <button className="btn" onClick={confirm}>
        확인
      </button>
    </>
  );
}
