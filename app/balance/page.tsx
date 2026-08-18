"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { WarnIcon } from "@/components/icons";
import { calcBalancePlan, getCycleInfo } from "@/lib/balance";
import { useBalance } from "@/lib/hooks/useBalance";

const MAX_DIGITS = 7; // up to 9,999,999원

export default function BalancePage() {
  const router = useRouter();
  const { balance, setBalance } = useBalance();
  const [digits, setDigits] = useState(String(balance));
  // The keypad starts showing the known balance for reference; the first
  // keypress should start a fresh number rather than append to it.
  const [touched, setTouched] = useState(false);
  // Reset the keypad buffer whenever the stored balance changes underneath us
  // (e.g. hydrating from localStorage after mount). Adjusting state during
  // render — rather than in an effect — avoids an extra flash of the stale
  // buffer; see https://react.dev/learn/you-might-not-need-an-effect.
  const [syncedBalance, setSyncedBalance] = useState(balance);
  if (balance !== syncedBalance) {
    setSyncedBalance(balance);
    setDigits(String(balance));
    setTouched(false);
  }

  const value = Number(digits || "0");
  const now = new Date();
  const plan = calcBalancePlan(value, now);
  const { cycleEnd } = getCycleInfo(now);

  const pressDigit = (d: string) => {
    setDigits((prev) => {
      const base = touched ? prev : "";
      const next = (base + d).replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS);
      return next || "0";
    });
    setTouched(true);
  };
  const pressBackspace = () => {
    if (!touched) {
      setDigits("0");
      setTouched(true);
      return;
    }
    setDigits((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };
  const save = () => {
    setBalance(value);
    router.push("/");
  };

  return (
    <>
      <NavBar title="잔액 입력" backHref="/" />

      <div className="screenBody">
        <div className="bigin">
          <p className="v">
            <span className="cur">₩</span>
            {value.toLocaleString()}
          </p>
          <p className="cap">카드 앱이나 문자에서 확인한 금액을 넣어줘</p>
        </div>

        <div className="pad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button key={n} onClick={() => pressDigit(n)}>
              {n}
            </button>
          ))}
          <button className="fn" onClick={() => pressDigit("000")}>
            000
          </button>
          <button onClick={() => pressDigit("0")}>0</button>
          <button className="fn" onClick={pressBackspace}>
            지우기
          </button>
        </div>

        <div className="card">
          <p className="lbl">이렇게 쓰면 딱 맞아</p>
          <div className="calc">
            <div className="r">
              <span>남은 사용 가능일</span>
              <b>{plan.remainingDays}일</b>
            </div>
            <div className="r">
              <span>하루 권장 사용액</span>
              <b>{plan.dailyRecommended.toLocaleString()}원</b>
            </div>
            <div className="r">
              <span>1일 결제 한도</span>
              <b>{plan.dailyLimit.toLocaleString()}원</b>
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
            남은 금액은 {cycleEnd.getMonth() + 1}월 {cycleEnd.getDate()}일에 없어지고 다음 달로
            넘어가지 않아. 미리 알려줄게.
          </span>
        </div>
      </div>

      <div className="footerAction">
        <button className="btn" onClick={save}>
          저장하고 홈으로
        </button>
      </div>
    </>
  );
}
