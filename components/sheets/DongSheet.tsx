"use client";

import { NEIGHBORHOODS } from "@/lib/taxonomy";
import { storesInDong } from "@/lib/stores";
import { PinIcon } from "@/components/icons";
import { useSheet, useToast } from "@/lib/overlay/OverlayProvider";
import { setDong, useDong } from "@/lib/hooks/useDong";
import type { Dong } from "@/lib/types";
import { useAppLocation } from "@/lib/location/LocationProvider";

export function DongSheet() {
  const dong = useDong();
  const { close } = useSheet();
  const { show } = useToast();
  const { gpsLocation, clearGpsLocation } = useAppLocation();

  const handleSelect = (next: Dong) => {
    clearGpsLocation();
    setDong(next);
    close();
    show(`${next} 기준으로 바꿨어요`);
  };

  return (
    <>
      <h3>{gpsLocation ? "현재 위치를 사용하고 있어요" : "어느 지역에서 볼까요?"}</h3>
      <p className="desc">
        {gpsLocation
          ? "GPS 주변 가맹점을 보여줘요. 지역을 직접 선택하면 GPS 기준이 해제돼요."
          : "위치 권한을 사용하지 않을 때 선택한 지역을 기준으로 보여줘요."}
      </p>
      {NEIGHBORHOODS.map((d) => (
        <button
          key={d}
          className={`choice${!gpsLocation && dong === d ? " on" : ""}`}
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
