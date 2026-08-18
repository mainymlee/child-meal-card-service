"use client";

import Link from "next/link";
import { calcBalancePlan, getCycleInfo } from "@/lib/balance";
import { PERSONA } from "@/lib/persona";
import { useBalance } from "@/lib/hooks/useBalance";
import { matchForPersona, WELFARE_PERSONA } from "@/lib/welfare";
import { TabBar } from "@/components/layout/TabBar";
import { CardIcon, ChevronIcon, FoodIcon, GiftIcon, WarnIcon } from "@/components/icons";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function HomePage() {
  const { balance, lastUpdatedISO } = useBalance();
  const now = new Date();
  const { remainingDays, dailyRecommended, expiringAmount } = calcBalancePlan(
    balance,
    now
  );
  const { cycleEnd } = getCycleInfo(now);
  const daysInMonth = cycleEnd.getDate();
  const elapsedDays = daysInMonth - remainingDays;
  const elapsedPct = Math.round((elapsedDays / daysInMonth) * 100);

  const newBenefitCount = matchForPersona([
    WELFARE_PERSONA.type,
    "아동",
    WELFARE_PERSONA.schoolLevel,
  ]).filter((p) => p.status === "신청가능").length;

  return (
    <>
      <div className="navbar">
        <h5>한끼</h5>
        <span className="act">도움말</span>
      </div>

      <div className="screenBody">
        <div className="greet">
          <p className="hi">
            {PERSONA.name}야, 오늘은
            <br />
            급식카드 쓸 수 있는 날이야
          </p>
          <span className="pill ok">
            <span className="d" />
            오늘 사용 가능 · {PERSONA.cardUsableUntil}까지
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
                {cycleEnd.getMonth() + 1}월 {cycleEnd.getDate()}일에 사라져. 하루에{" "}
                <b>{dailyRecommended.toLocaleString()}원</b>씩 쓰면 딱 맞아.
              </span>
            </div>
          ) : null}
        </div>

        <div className="actions">
          <Link className="rowbtn" href="/chat">
            <span className="ic">
              <FoodIcon size={19} />
            </span>
            <span>
              <p className="t">오늘 뭐 먹지?</p>
              <p className="s">지금 열린 곳 중에서 골라줄게</p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
          <Link className="rowbtn" href="/balance">
            <span className="ic">
              <CardIcon size={19} />
            </span>
            <span>
              <p className="t">잔액 입력하기</p>
              <p className="s">
                {lastUpdatedISO
                  ? `${formatDate(lastUpdatedISO)}에 마지막으로 입력했어`
                  : "아직 입력한 적 없어"}
              </p>
            </span>
            <span className="ch">
              <ChevronIcon size={16} />
            </span>
          </Link>
          <Link className="rowbtn" href="/welfare">
            <span className="ic">
              <GiftIcon size={19} />
            </span>
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
