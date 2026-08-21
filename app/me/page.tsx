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
import { nowInSeoul, toSeoulDate } from "@/lib/time";
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

export default function MePage() {
  const router = useRouter();
  const { balance, lastUpdatedISO } = useBalance();
  const dong = useDong() ?? DEFAULT_DONG;
  const expMode = useExpMode();
  const favorites = useFavorites();
  const profile = useProfile();
  const notif = useNotifPrefs();
  const { hourOverride } = useDemoHour();
  const reports = useReports();
  const { open } = useSheet();

  const now = nowInSeoul();
  const plan = calcBalancePlan(
    balance,
    now,
    expMode,
    lastUpdatedISO ? toSeoulDate(new Date(lastUpdatedISO)) : null
  );
  const home = dongCenter(dong);

  const favoriteStores = favorites
    .map(getStoreById)
    .filter((s): s is Store => s !== undefined);

  return (
    <>
      <div className="navbar meNavbar">
        <h1>내정보</h1>
      </div>

      <div className="screenBody mePage">
        <div className="card meCard meBalanceCard">
          <p className="lbl">잔액 요약</p>
          <p className="amount" style={{ fontSize: 28 }}>
            <b>{balance.toLocaleString()}</b>
            <span>원</span>
          </p>
          <p className="sub">
            하루 지원 기준은 {plan.dailyRecommended.toLocaleString()}원이에요
          </p>
          <Link className="btn ghost sm" href="/balance" style={{ marginTop: 12 }}>
            잔액 다시 입력
          </Link>
        </div>

        <div className="card meCard meProfileCard">
          <div style={{ display: "flex", alignItems: "center" }}>
            <p className="lbl" style={{ margin: 0 }}>
              내 조건
            </p>
            <button
              className="meEditButton"
              onClick={() => open(<ProfileSheet />)}
              aria-label="내 조건 수정"
            >
              수정하기
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

        <button className="mrow meMenuRow meDongRow" onClick={() => open(<DongSheet />)}>
          내 동네
          <span className="v">{dong}</span>
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </button>

        <div className="card meCard meFavoriteCard">
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

        <div className="card meCard meNotificationCard">
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

        <Link className="mrow meMenuRow meWelfareRow" href="/welfare">
          받을 수 있는 혜택
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </Link>
        <button
          className="mrow meMenuRow meReportRow"
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
        <Link className="mrow meMenuRow" href="/menu-verify">
          메뉴판 사진 확인 도구
          <span className="ch">
            <ChevronIcon size={17} />
          </span>
        </Link>
      </div>

      <TabBar />
    </>
  );
}
