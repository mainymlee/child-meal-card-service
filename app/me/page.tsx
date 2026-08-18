"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";
import { StoreRow } from "@/components/StoreRow";
import { ChevronIcon } from "@/components/icons";
import { calcBalancePlan } from "@/lib/balance";
import { dongCenter } from "@/lib/persona";
import { distanceMeters, getStoreById, isOpenNow } from "@/lib/stores";
import type { Store } from "@/lib/types";
import { verificationStatus } from "@/lib/ranking";
import { nowInSeoul } from "@/lib/time";
import { useBalance } from "@/lib/hooks/useBalance";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { useExpMode } from "@/lib/hooks/useExpMode";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useProfile } from "@/lib/hooks/useProfile";
import { useNotifPrefs, setNotifPrefs } from "@/lib/hooks/useNotifPrefs";
import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useReports } from "@/lib/hooks/useReports";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { DongSheet } from "@/components/sheets/DongSheet";
import { ProfileSheet } from "@/components/sheets/ProfileSheet";
import { KakaoStatusSheet } from "@/components/sheets/KakaoStatusSheet";

const HAS_KAKAO_KEY = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);

export default function MePage() {
  const router = useRouter();
  const { balance } = useBalance();
  const dong = useDong() ?? DEFAULT_DONG;
  const expMode = useExpMode();
  const favorites = useFavorites();
  const profile = useProfile();
  const notif = useNotifPrefs();
  const { hourOverride } = useDemoHour();
  const reports = useReports();
  const { open } = useSheet();

  const now = nowInSeoul();
  const plan = calcBalancePlan(balance, now, expMode);
  const home = dongCenter(dong);

  const favoriteStores = favorites
    .map(getStoreById)
    .filter((s): s is Store => s !== undefined);

  return (
    <>
      <div className="navbar">
        <h1>내정보</h1>
      </div>

      <div className="screenBody">
        <div className="card">
          <p className="lbl">잔액 요약</p>
          <p className="amount" style={{ fontSize: 28 }}>
            <b>{balance.toLocaleString()}</b>
            <span>원</span>
          </p>
          <p className="sub">
            하루 {plan.dailyRecommended.toLocaleString()}원 쓰면 딱 맞아요
          </p>
          <Link className="btn ghost sm" href="/balance" style={{ marginTop: 12 }}>
            잔액 다시 입력
          </Link>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center" }}>
            <p className="lbl" style={{ margin: 0 }}>
              내 조건
            </p>
            <button
              className="act"
              style={{ marginLeft: "auto", padding: 0 }}
              onClick={() => open(<ProfileSheet />)}
            >
              수정
            </button>
          </div>
          <p className="sub" style={{ margin: "4px 0 8px" }}>
            혜택 찾기에만 써요
          </p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span className="pill neu">{profile.familyType}</span>
            <span className="pill neu">{profile.schoolLevel}</span>
          </div>
        </div>

        <button className="mrow" onClick={() => open(<DongSheet />)}>
          내 동네
          <span className="v">{dong}</span>
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </button>

        <div className="card">
          <p className="lbl">단골 가게</p>
          {favoriteStores.length ? (
            favoriteStores.map((store) => (
              <StoreRow
                key={store.id}
                store={store}
                distance={distanceMeters(home, store)}
                openNow={isOpenNow(store, now, hourOverride)}
                verification={verificationStatus(reports, store.id)}
                onClick={() => router.push(`/store/${store.id}`)}
              />
            ))
          ) : (
            <p className="sub">가게 상세에서 ♥를 누르면 여기에 모여요.</p>
          )}
        </div>

        <div className="card">
          <p className="lbl">알림</p>
          <div className="mrow" style={{ cursor: "default" }}>
            월초 충전 알림
            <button
              className={`switch${notif.monthly ? " on" : ""}`}
              role="switch"
              aria-checked={notif.monthly}
              aria-label="월초 충전 알림"
              onClick={() => setNotifPrefs({ ...notif, monthly: !notif.monthly })}
            />
          </div>
          <div className="mrow" style={{ cursor: "default" }}>
            소멸 D-7 · D-1 알림
            <button
              className={`switch${notif.dday ? " on" : ""}`}
              role="switch"
              aria-checked={notif.dday}
              aria-label="소멸 임박 알림"
              onClick={() => setNotifPrefs({ ...notif, dday: !notif.dday })}
            />
          </div>
        </div>

        <Link className="mrow" href="/welfare">
          받을 수 있는 혜택
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </Link>
        <button
          className="mrow"
          onClick={() =>
            open(
              <>
                <h3>카드가 안 됐나요?</h3>
                <p className="desc">
                  가게 상세 화면 맨 아래{" "}
                  <b style={{ color: "var(--red)" }}>&quot;여기서 급식카드가 안 됐어요&quot;</b>{" "}
                  버튼을 누르면 돼요. 접수되면 그 가게는 확인이 끝날 때까지 추천에서 뒤로
                  미뤄져요.
                </p>
              </>
            )
          }
        >
          가게에서 카드가 안 됐어요
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </button>
        <button className="mrow" onClick={() => open(<KakaoStatusSheet />)}>
          카카오맵 연결
          <span className="v">{HAS_KAKAO_KEY ? "연결됨" : "약도 모드"}</span>
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </button>
      </div>

      <TabBar />
    </>
  );
}
