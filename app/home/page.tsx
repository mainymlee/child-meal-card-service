"use client";

import Link from "next/link";
import { calcBalancePlan, getCycleInfo } from "@/lib/balance";
import { useBalance } from "@/lib/hooks/useBalance";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { useExpMode } from "@/lib/hooks/useExpMode";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { ExpirySheet } from "@/components/sheets/ExpirySheet";
import { HelpSheet } from "@/components/sheets/HelpSheet";
import { nowInSeoul, toSeoulDate } from "@/lib/time";
import { getStoreById, isOpenNow, storesInDong } from "@/lib/stores";
import { matchForPersona, profileToTags, WELFARE_POLICIES } from "@/lib/welfare";
import { useProfile } from "@/lib/hooks/useProfile";
import { TabBar } from "@/components/layout/TabBar";
import { DongButton } from "@/components/layout/DongButton";
import { CheckIcon, ChevronIcon, WarnIcon } from "@/components/icons";

function formatDate(iso: string): string {
  const d = toSeoulDate(new Date(iso));
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function AppHomePage() {
  const { balance, lastUpdatedISO } = useBalance();
  const dong = useDong() ?? DEFAULT_DONG;
  const expMode = useExpMode();
  const favorites = useFavorites();
  const profile = useProfile();
  const { hourOverride } = useDemoHour();
  const { open } = useSheet();

  const now = nowInSeoul();
  const { remainingDays, dailyRecommended, dailySpendNeeded, expiringAmount } = calcBalancePlan(
    balance,
    now,
    expMode,
    lastUpdatedISO ? toSeoulDate(new Date(lastUpdatedISO)) : null
  );
  const { cycleEnd } = getCycleInfo(now, expMode);
  const daysInMonth = cycleEnd.getDate();
  const elapsedDays = Math.max(0, daysInMonth - remainingDays);
  const elapsedPct = Math.min(95, Math.max(5, Math.round((elapsedDays / daysInMonth) * 100)));

  const dongStores = storesInDong(dong);
  const openableCount = dongStores.filter(
    (s) => s.cat2 !== "cvs" && isOpenNow(s, now, hourOverride)
  ).length;
  const cvsOpenCount = dongStores.filter(
    (s) => s.cat2 === "cvs" && isOpenNow(s, now, hourOverride)
  ).length;

  const favoriteInDong = favorites
    .map(getStoreById)
    .find((s) => s && s.neighborhood === dong);

  const newBenefitCount = matchForPersona(profileToTags(profile), WELFARE_POLICIES).filter(
    (p) => p.status === "신청가능"
  ).length;

  return (
    <>
      <div className="navbar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="applogo" src="/app-logo.png" alt="" />
        <h1>한끼</h1>
        <DongButton />
        <button className="act" onClick={() => open(<HelpSheet />)}>
          도움말
        </button>
      </div>

      <div className="screenBody">
        <div className="block fade">
          <p className="blabel">이번 달 남은 돈</p>
          <p className="amount">
            <b>{balance.toLocaleString()}</b>
            <span>원</span>
          </p>
          <div className="meter">
            <div className="track">
              <div className="fill" style={{ width: `${elapsedPct}%` }} />
            </div>
          </div>
          <p className="bdays">
            앞으로 <b>{remainingDays}일</b> 쓸 수 있어
          </p>
          {expiringAmount > 0 ? (
            <div className="innerbox warn">
              <WarnIcon size={15} />
              <span className="spendingNotice">
                <span>하루 지원 기준 <b>{dailyRecommended.toLocaleString()}원</b></span>
                <span>모두 쓰려면 하루 <b>{dailySpendNeeded.toLocaleString()}원</b>이 필요해</span>
                <span className="noticeRisk">이대로면 <b>{expiringAmount.toLocaleString()}원</b>이 남을 수 있어</span>
              </span>
            </div>
          ) : (
            <div className="innerbox">
              <CheckIcon size={16} />
              <span className="spendingNotice">
                <span>하루 지원 기준 <b>{dailyRecommended.toLocaleString()}원</b></span>
                <span>기준 안에서 잔액을 모두 쓸 수 있어</span>
              </span>
            </div>
          )}
          <button className="linkline" onClick={() => open(<ExpirySheet />)}>
            우리 지역 이월·소멸 규정 보기 ›
          </button>
        </div>

        <div className="tiles">
          <Link className="tile t-y" href="/result">
            <span className="sticker tossface">🍚</span>
            <span className="tt">오늘 뭐 먹지</span>
            <span className="ts">지금 {openableCount}곳 열림</span>
          </Link>
          <Link className="tile t-b" href="/cvs">
            <span className="sticker tossface">🏪</span>
            <span className="tt">편의점 조합</span>
            <span className="ts">{cvsOpenCount}곳 열림, 조합 3개</span>
          </Link>
          <Link className="tile t-p" href="/balance">
            <span className="sticker tossface">💳</span>
            <span className="tt">잔액 입력</span>
            <span className="ts">
              {lastUpdatedISO ? `마지막 ${formatDate(lastUpdatedISO)}` : "아직 입력 안 함"}
            </span>
          </Link>
          <Link className="tile t-k" href="/welfare">
            <span className="sticker tossface">🎁</span>
            <span className="tt">혜택 찾기</span>
            <span className="ts">새로 찾은 {newBenefitCount}개</span>
          </Link>
        </div>

        {favoriteInDong ? (
          <Link className="favrow" href={`/store/${favoriteInDong.id}`}>
            <span className="sticker tossface">❤️</span>
            <span>
              <span className="tt">지난번 갔던 {favoriteInDong.name}</span>
              <span className="ts">
                {isOpenNow(favoriteInDong, now, hourOverride)
                  ? "지금 영업 중"
                  : `${favoriteInDong.hours.open}에 열어요`}
              </span>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
        ) : null}
      </div>

      <TabBar />
    </>
  );
}
