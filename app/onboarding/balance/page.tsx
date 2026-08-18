"use client";

import { useRouter } from "next/navigation";
import { Keypad } from "@/components/balance/Keypad";
import { useBalance } from "@/lib/hooks/useBalance";
import { useKeypadBuffer } from "@/lib/hooks/useKeypadBuffer";

const QUICK_AMOUNTS = [10000, 50000, 100000, 160000];

export default function OnboardingBalancePage() {
  const router = useRouter();
  const { setBalance } = useBalance();
  const { value, pressDigit, pressBackspace, reset } = useKeypadBuffer(0);

  const save = () => {
    if (value > 0) setBalance(value);
    router.push("/onboarding/done");
  };

  return (
    <main>
      <div className="ob fade balanceOnboarding">
      <div className="steps">
        <i className="on" />
        <i className="on" />
        <i />
      </div>
      <h2>
        카드에 지금
        <br />
        얼마 남아 있나요?
      </h2>
      <p className="desc">
        카드 앱이나 문자에서 확인한 금액이면 돼요. 나중에 넣어도 괜찮아요.
      </p>
      <div className="bigin">
        <p className="v">
          <span className="cur">₩</span>
          {value.toLocaleString()}
        </p>
      </div>
      <div className="quickamt">
        {QUICK_AMOUNTS.map((n) => (
          <button key={n} onClick={() => reset(value + n, true)}>
            +{(n / 10000).toLocaleString()}만원
          </button>
        ))}
        <button onClick={() => reset(0, true)}>지우기</button>
      </div>
      <Keypad onDigit={pressDigit} onBackspace={pressBackspace} />
      <div className="grow" />
      <button className="btn" onClick={save}>
        저장하고 다음
      </button>
      <button className="skiplink" onClick={() => router.push("/onboarding/done")}>
        지금은 건너뛰기
      </button>
      </div>
    </main>
  );
}
