"use client";

import { NEIGHBORHOODS } from "@/lib/taxonomy";
import { storesInDong } from "@/lib/stores";
import { PinIcon } from "@/components/icons";
import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { setDong, useDong } from "@/lib/hooks/useDong";
import type { Dong } from "@/lib/types";

export function DongSheet() {
  const dong = useDong();
  const { close } = useSheet();
  const { show } = useToast();

  const handleSelect = (next: Dong) => {
    setDong(next);
    close();
    show(`${next} 기준으로 바꿨어요`);
  };

  return (
    <>
      <h3>어느 동네에서 볼까요?</h3>
      <p className="desc">선택한 동네를 중심으로 지도와 가맹점 목록이 바뀌어요.</p>
      {NEIGHBORHOODS.map((d) => (
        <button
          key={d}
          className={`choice${dong === d ? " on" : ""}`}
          onClick={() => handleSelect(d)}
        >
          <PinIcon />
          {d}
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "var(--g400)" }}>
            {storesInDong(d).length}곳
          </span>
        </button>
      ))}
    </>
  );
}
