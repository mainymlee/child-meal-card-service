"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { WarnIcon } from "@/components/icons";
import { Keypad } from "@/components/balance/Keypad";
import { calcBalancePlan, getCycleInfo } from "@/lib/balance";
import { useBalance } from "@/lib/hooks/useBalance";
import { useExpMode } from "@/lib/hooks/useExpMode";
import { useKeypadBuffer } from "@/lib/hooks/useKeypadBuffer";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { ExpirySheet } from "@/components/sheets/ExpirySheet";
import { nowInSeoul } from "@/lib/time";

export default function BalancePage() {
  const router = useRouter();
  const { balance, setBalance } = useBalance();
  const expMode = useExpMode();
  const { open } = useSheet();
  const { value, pressDigit, pressBackspace, reset } = useKeypadBuffer(balance);

  // Adjust the buffer when the stored balance changes underneath us (e.g.
  // hydrating from localStorage after mount) — done during render, not an
  // effect, per this project's set-state-in-effect lint constraint.
  const [syncedBalance, setSyncedBalanceState] = useState(balance);
  if (balance !== syncedBalance) {
    setSyncedBalanceState(balance);
    reset(balance);
  }

  const now = nowInSeoul();
  const plan = calcBalancePlan(value, now, expMode);
  const { cycleEnd } = getCycleInfo(now, expMode);

  const save = () => {
    setBalance(value);
    router.push("/home");
  };

  return (
    <>
      <NavBar title="잔액 입력" backHref="/home" />

      <div className="screenBody">
        <div className="bigin">
          <p className="v">
            <span className="cur">₩</span>
            {value.toLocaleString()}
          </p>
          <p className="cap">카드 앱이나 문자에서 확인한 금액을 넣어주세요</p>
        </div>

        <Keypad onDigit={pressDigit} onBackspace={pressBackspace} />

        <div className="card">
          <p className="lbl">이렇게 쓰면 딱 맞아</p>
          <div className="calc">
            <div className="r">
              <span>남은 사용 가능일</span>
              <b>{plan.remainingDays}일</b>
            </div>
            <div className="r">
              <span>하루 지원 기준</span>
              <b>{plan.dailyRecommended.toLocaleString()}원</b>
            </div>
            <div className="r">
              <span>잔액 소진 필요액</span>
              <b>{plan.dailySpendNeeded.toLocaleString()}원</b>
            </div>
            <div className="r">
              <span>AI 추천 예산 상한</span>
              <b>{plan.recommendedUpperBound.toLocaleString()}원</b>
            </div>
            <div className="r hl">
              <span>이대로면 사라지는 금액</span>
              <b>{plan.expiringAmount.toLocaleString()}원</b>
            </div>
          </div>
        </div>

        <div className="alert warn" style={{ marginTop: 2 }}>
          <WarnIcon size={15} />
          <span>
            남은 금액은 {cycleEnd.getMonth() + 1}월 {cycleEnd.getDate()}일에 사라져요. 사라지기{" "}
            <b>7일 전</b>과 <b>하루 전</b>에 앱을 열면 잔액 상황을 확인할 수 있어요.
          </span>
        </div>
        <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => open(<ExpirySheet />)}>
          이월·소멸 규정 확인하기
        </button>
      </div>

      <div className="footerAction">
        <button className="btn" onClick={save}>
          저장하고 홈으로
        </button>
      </div>
    </>
  );
}
