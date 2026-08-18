"use client";

import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useSheet } from "@/lib/overlay/OverlayProvider";

const OPTIONS: [number | null, string][] = [
  [8, "아침 (08:00)"],
  [11.5, "점심 (11:30)"],
  [15, "오후 (15:00)"],
  [19, "저녁 (19:00)"],
  [23.5, "밤 (23:30)"],
  [null, "실제 시간으로"],
];

export function DemoHourSheet() {
  const { hourOverride, setHourOverride } = useDemoHour();
  const { close } = useSheet();

  return (
    <>
      <h3>시연용 시간 바꾸기</h3>
      <p className="desc">
        시간에 따라 &quot;지금 열린 곳&quot; 필터와 빈 상태 → 편의점 모드가 어떻게 달라지는지
        볼 수 있어요. (심사 시연용 장치)
      </p>
      {OPTIONS.map(([hour, label]) => (
        <button
          key={label}
          className={`choice${hourOverride === hour ? " on" : ""}`}
          onClick={() => {
            setHourOverride(hour);
            close();
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
