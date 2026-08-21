"use client";

import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { setExpMode, useExpMode } from "@/lib/hooks/useExpMode";

export function ExpirySheet() {
  const expMode = useExpMode();
  const { close } = useSheet();
  const { show } = useToast();

  const choose = (mode: "month" | "year") => {
    setExpMode(mode);
    close();
    show(
      mode === "month"
        ? "매월 말 소멸 기준으로 계산해요"
        : "월 이월, 12월 말 소멸 기준으로 계산해요"
    );
  };

  return (
    <>
      <h3>잔액, 다음 달로 넘어가나요?</h3>
      <p className="desc">
        <b>지역마다 달라요.</b> 예를 들어 경기도(씨앗밥상)는 월말 잔액이 <b>다음 달로 이월</b>
        되고 12월 말에만 소멸돼요. 반면 매월 말 소멸되는 지역도 있어요.
        <br />
        <br />
        춘천시 공식 안내에는 이월 여부가 명시돼 있지 않아요. 정확한 규정은{" "}
        <b>춘천시청 보육아동과(033-250-3686)</b>에 확인해요. 확인 전까지는 안전하게{" "}
        <b>매월 다 쓰는 것</b>을 기준으로 계산할게요.
      </p>
      <p className="lbl">계산 기준 (확인 후 바꿔요)</p>
      <button
        className={`choice${expMode === "month" ? " on" : ""}`}
        onClick={() => choose("month")}
      >
        매월 말 소멸 기준{" "}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--g500)" }}>
          보수적 권장
        </span>
      </button>
      <button
        className={`choice${expMode === "year" ? " on" : ""}`}
        onClick={() => choose("year")}
      >
        월 이월, 12월 말 소멸 기준
      </button>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <a className="btn ghost sm" style={{ flex: 1 }} href="tel:033-250-3686">
          보육아동과 전화
        </a>
        <a
          className="btn ghost sm"
          style={{ flex: 1 }}
          href="https://www.chuncheon.go.kr/new-welfare/life/child/absenteeism/"
          target="_blank"
          rel="noopener noreferrer"
        >
          공식 안내 보기
        </a>
      </div>
    </>
  );
}
