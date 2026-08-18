"use client";

import { useRouter } from "next/navigation";
import { PinIcon } from "@/components/icons";
import { NEIGHBORHOODS } from "@/lib/taxonomy";
import { setDong, useDong } from "@/lib/hooks/useDong";

export default function OnboardingDongPage() {
  const router = useRouter();
  const dong = useDong();

  return (
    <main>
      <div className="ob fade">
      <div className="steps">
        <i className="on" />
        <i />
        <i />
      </div>
      <h2>
        어느 동네에서
        <br />
        주로 드세요?
      </h2>
      <p className="desc">
        지금 갈 수 있는 가게를 찾을 때만 쓰고, 다른 곳에는 쓰지 않아요. 나중에 언제든 바꿀 수
        있어요.
      </p>
      {NEIGHBORHOODS.map((d) => (
        <button
          key={d}
          className={`choice${dong === d ? " on" : ""}`}
          onClick={() => setDong(d)}
        >
          <PinIcon />
          {d}
        </button>
      ))}
      <div className="grow" />
      <button
        className="btn"
        disabled={!dong}
        onClick={() => router.push("/onboarding/balance")}
      >
        다음
      </button>
      </div>
    </main>
  );
}
