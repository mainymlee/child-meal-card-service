"use client";

import Link from "next/link";
import { calcBalancePlan, getCycleInfo } from "@/lib/balance";
import { CARD_USABLE_UNTIL, DEMO_USER_NAME } from "@/lib/persona";
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

export default function HomePage() {
  const { balance, lastUpdatedISO } = useBalance();
  const dong = useDong() ?? DEFAULT_DONG;
  const expMode = useExpMode();
  const favorites = useFavorites();
  const profile = useProfile();
  const { hourOverride } = useDemoHour();
  const { open } = useSheet();

  const now = nowInSeoul();
  const { remainingDays, dailyRecommended, expiringAmount } = calcBalancePlan(
    balance,
    now,
    expMode
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
        <h1>한끼</h1>
        <DongButton />
        <button className="act" onClick={() => open(<HelpSheet />)}>
          도움말
        </button>
      </div>

      <div className="screenBody">
        <div className="greet">
          <p className="hi">
            {DEMO_USER_NAME}님, 오늘도
            <br />
            급식카드 쓸 수 있어요
          </p>
          <span className="pill ok">
            <span className="d" />
            오늘 사용 가능 · {CARD_USABLE_UNTIL}까지
          </span>
        </div>

        <div className="card">
          <p className="lbl">이번 달 남은 금액</p>
          <p className="amount">
            <b>{balance.toLocaleString()}</b>
            <span>원</span>
          </p>
          <p className="sub">
            {now.getMonth() + 1}월 · 남은 사용 가능일 {remainingDays}일
          </p>
          <div className="meter">
            <div className="track">
              <div className="fill" style={{ width: `${elapsedPct}%` }} />
            </div>
            <div className="legend">
              <span>
                이번 달 경과 <b>{elapsedDays}일</b>
              </span>
              <span>
                남은 기간 <b>{remainingDays}일</b>
              </span>
            </div>
          </div>
          {expiringAmount > 0 ? (
            <div className="alert warn">
              <WarnIcon size={15} />
              <span>
                이대로면 <b>{expiringAmount.toLocaleString()}원</b>이{" "}
                {cycleEnd.getMonth() + 1}월 {cycleEnd.getDate()}일에 사라져요. 하루{" "}
                <b>{dailyRecommended.toLocaleString()}원</b>씩 쓰면 딱 맞아요.
              </span>
            </div>
          ) : (
            <div className="alert good">
              <CheckIcon size={16} />
              <span>
                이 속도면 <b>사라지는 돈 없이</b> 다 쓸 수 있어요. 하루{" "}
                <b>{dailyRecommended.toLocaleString()}원</b>이 기준이에요.
              </span>
            </div>
          )}
          <button className="linkline" onClick={() => open(<ExpirySheet />)}>
            우리 지역 이월·소멸 규정 보기 ›
          </button>
        </div>

        {favoriteInDong ? (
          <Link className="rowbtn" href={`/store/${favoriteInDong.id}`}>
            <span className="ic">❤️</span>
            <span>
              <p className="t">지난번 갔던 {favoriteInDong.name}</p>
              <p className="s">
                {isOpenNow(favoriteInDong, now, hourOverride)
                  ? "지금 영업 중"
                  : `${favoriteInDong.hours.open}에 열어요`}
              </p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
        ) : null}

        <div className="actions">
          <Link className="rowbtn" href="/result">
            <span className="ic">🍚</span>
            <span>
              <p className="t">오늘 뭐 먹지?</p>
              <p className="s">
                {openableCount > 0
                  ? `${dong}에 지금 열린 곳 ${openableCount}곳`
                  : "식당은 닫혔어요 — 편의점 조합을 알려드릴게요"}
              </p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
          <Link className="rowbtn" href="/cvs">
            <span className="ic">🏪</span>
            <span>
              <p className="t">편의점에서 균형 있게</p>
              <p className="s">지금 열린 편의점 {cvsOpenCount}곳 · 1만 원 안 조합 3개</p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
          <Link className="rowbtn" href="/balance">
            <span className="ic">💳</span>
            <span>
              <p className="t">잔액 입력하기</p>
              <p className="s">
                {lastUpdatedISO
                  ? `${formatDate(lastUpdatedISO)}에 마지막으로 입력했어요`
                  : "아직 입력한 적 없어요"}
              </p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
          <Link className="rowbtn" href="/welfare">
            <span className="ic">🎁</span>
            <span>
              <p className="t">받을 수 있는 혜택</p>
              <p className="s">새로 찾은 제도 {newBenefitCount}개</p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
        </div>
      </div>

      <TabBar />
    </>
  );
}
