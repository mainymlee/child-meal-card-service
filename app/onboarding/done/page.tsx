"use client";

import { useRouter } from "next/navigation";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { markOnboarded } from "@/lib/onboarding";

export default function OnboardingDonePage() {
  const router = useRouter();
  const dong = useDong() ?? DEFAULT_DONG;

  const start = () => {
    markOnboarded();
    router.replace("/");
  };

  return (
    <div className="ob fade" style={{ textAlign: "center", justifyContent: "center" }}>
      <div className="steps">
        <i className="on" />
        <i className="on" />
        <i className="on" />
      </div>
      <div className="grow" />
      <div style={{ fontSize: 52, marginBottom: 14 }}>🍚</div>
      <h2 style={{ textAlign: "center" }}>준비 끝!</h2>
      <p className="desc" style={{ textAlign: "center" }}>
        {dong} 근처에서 지금 갈 수 있는 곳부터 보여드릴게요.
        <br />
        가족 상황은 묻지 않아요 — 혜택 찾기를 쓸 때만 물어볼게요.
      </p>
      <div className="grow" />
      <button className="btn" onClick={start}>
        시작하기
      </button>
    </div>
  );
}
