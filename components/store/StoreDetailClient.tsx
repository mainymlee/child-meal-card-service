"use client";

import { useEffect, useRef } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { StoreBadgePills } from "@/components/Pill";
import { FavoriteButton } from "@/components/store/FavoriteButton";
import { ReportButton } from "@/components/store/ReportButton";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { VisitSheet } from "@/components/sheets/VisitSheet";
import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useMealLog } from "@/lib/hooks/useMealLog";
import { useReports } from "@/lib/hooks/useReports";
import { verificationStatus } from "@/lib/ranking";
import { dongCenter } from "@/lib/persona";
import { distanceMeters, isOpenNow, walkingMinutes } from "@/lib/stores";
import { nowInSeoul } from "@/lib/time";
import type { Store } from "@/lib/types";
import { useAppLocation } from "@/lib/location/LocationProvider";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const CATEGORY_EMOJI = { kr: "🍚", cn: "🥡", wf: "🍴", bs: "🍢", cvs: "🏪" } as const;

export function StoreDetailClient({ store }: { store: Store }) {
  const { hourOverride } = useDemoHour();
  const mealLog = useMealLog();
  const reports = useReports();
  const { open } = useSheet();
  const { gpsLocation } = useAppLocation();
  const visitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = nowInSeoul();
  const home = gpsLocation ?? dongCenter(store.neighborhood);
  const openNow = isOpenNow(store, now, hourOverride);
  const distance = distanceMeters(home, store);
  const walk = walkingMinutes(distance);
  const isCvs = store.cat2 === "cvs";
  const verification = verificationStatus(reports, store.id);

  const directionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`;
  const kakaoViewUrl = `https://map.kakao.com/link/map/${encodeURIComponent(store.name)},${store.lat},${store.lng}`;

  const recentRepeats = mealLog.filter((meal) => meal.grp === store.grp).length;

  const handleNavigate = () => {
    if (visitTimerRef.current) clearTimeout(visitTimerRef.current);
    visitTimerRef.current = setTimeout(() => open(<VisitSheet storeId={store.id} />), 1200);
  };

  useEffect(() => () => {
    if (visitTimerRef.current) clearTimeout(visitTimerRef.current);
  }, []);

  return (
    <>
      <NavBar
        title={store.name}
        backHref="/result"
        action={<FavoriteButton storeId={store.id} />}
      />

      <div className="screenBody">
        <div className="hero tossface">{CATEGORY_EMOJI[store.cat2]}</div>

        <div style={{ marginBottom: 10 }}>
          <StoreBadgePills
            openNow={openNow}
            isCvs={isCvs}
            soloFriendly={store.badges.soloFriendly}
            takeoutAvailable={store.badges.takeoutAvailable}
            verification={verification}
          />
        </div>

        <p className="nm" style={{ fontSize: 19, letterSpacing: "-.02em", margin: "0 0 3px" }}>
          {store.name}
        </p>
        <p className="mt" style={{ margin: 0 }}>
          {store.category} · {store.neighborhood}
        </p>

        <dl className="kv">
          <dt>영업시간</dt>
          <dd>
            {isCvs ? "24시간" : `${store.hours.open} – ${store.hours.close}`}
            {store.closedDays.length ? (
              <span style={{ color: "var(--g400)" }}>
                {" "}
                · {WEEKDAY_LABELS[store.closedDays[0]]}요일 휴무
              </span>
            ) : null}
            {store.breakTime ? (
              <span style={{ color: "var(--g400)" }}> · {store.breakTime}</span>
            ) : null}
            {store.hoursEst ? <span className="pill warn">확인 필요</span> : null}{" "}
            <span style={{ color: openNow ? "var(--green)" : "var(--g400)", fontWeight: 700 }}>
              · {openNow ? "영업 중" : "영업 종료"}
            </span>
          </dd>
          <dt>거리</dt>
          <dd>
            {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`} · 도보{" "}
            {walk}분
          </dd>
          <dt>주문 방식</dt>
          <dd>{store.counterDescription}</dd>
          <dt>확인일</dt>
          <dd>
            {store.badges.paymentConfirmedDate ?? "아직 확인 안 됨"}{" "}
            <span style={{ color: "var(--g400)" }}>
              ({verification === "ok" ? "결제 확인" : "신고 접수 · 재확인 중"})
            </span>
          </dd>
        </dl>

        <div className="card" style={{ marginTop: 16 }}>
          <p className="lbl">
            {store.menuSource === "store-verified"
              ? "매장 확인 메뉴"
              : store.menuSource === "brand-official"
                ? "브랜드 공식 메뉴"
                : store.menuSource === "unverified"
                  ? "메뉴 확인 필요"
                  : "가게명·업종 기반 예상 메뉴"}
          </p>
          {store.menu.length ? (
            <ul className="menu">
              {store.menu.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <span className={`p ${item.underBudget ? "ok" : "over"}`}>
                    {store.menuSource === "store-verified" ? "" : "약 "}
                    {item.price.toLocaleString()}원
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sub" style={{ margin: 0 }}>
              가게 이름과 업종만으로 판매 메뉴를 판단하기 어려워요. 확인 전에는 추천에 사용하지 않아요.
            </p>
          )}
        </div>
        <p className="sub" style={{ fontSize: 12.5, color: "var(--g400)", margin: "-4px 2px 12px" }}>
          {store.menuSource === "store-verified"
            ? `${store.menuVerification?.verifiedAt.slice(0, 10) ?? "최근"} 매장 확인 기준이며 이후 변경될 수 있어요.`
            : store.menuSource === "brand-official"
              ? "브랜드 공식 메뉴 기준이며 지점별 판매 여부와 가격은 다를 수 있어요."
              : "메뉴와 가격은 실제 메뉴판이 아닌 예상값이며 방문 전 가게에 확인해주세요."}
        </p>

        {!isCvs && recentRepeats >= 2 ? (
          <div className="card flat">
            <p className="sub" style={{ margin: 0 }}>
              이번 주에 <b>{store.grp}</b>를 {recentRepeats}번 드셨어요. 오늘은 다른 종류가
              균형에 더 좋아요.
            </p>
          </div>
        ) : (
          <div className="card flat">
            <p className="sub" style={{ margin: 0 }}>
              {store.badges.soloFriendly
                ? "혼자 가도 편한 곳이에요 — 카운터에서 바로 주문하면 돼요."
                : "매장 식사 위주라 같이 가면 더 편해요."}
            </p>
          </div>
        )}
      </div>

      <div className="footerAction">
        <a className="btn" href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={handleNavigate}>
          길찾기 · 도보 {walk}분
        </a>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <a
            className="btn ghost sm"
            style={{ flex: 1 }}
            href={kakaoViewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            카카오맵에서 보기
          </a>
          {store.phone ? (
            <a className="btn ghost sm" style={{ flex: 1 }} href={`tel:${store.phone}`}>
              전화하기
            </a>
          ) : null}
        </div>
        <ReportButton storeId={store.id} dong={store.neighborhood} />
      </div>
    </>
  );
}
