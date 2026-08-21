"use client";

import { DownIcon } from "@/components/icons";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { DongSheet } from "@/components/sheets/DongSheet";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { useAppLocation } from "@/lib/location/LocationProvider";

export function DongButton() {
  const dong = useDong();
  const { gpsLocation } = useAppLocation();
  const { open } = useSheet();

  return (
    <button
      className="dongbtn"
      aria-label={gpsLocation ? "현재 위치 기준 설정" : "지역 바꾸기"}
      onClick={() => open(<DongSheet />)}
    >
      {gpsLocation ? "현재 위치" : dong ?? DEFAULT_DONG}
      <DownIcon size={14} strokeWidth={2.2} />
    </button>
  );
}
