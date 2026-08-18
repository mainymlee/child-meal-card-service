"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  onClick?: () => void;
}

interface KakaoMapProps {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  height?: number;
}

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

export function KakaoMap({ center, markers, height = 180 }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const [ready, setReady] = useState(false);

  const initMap = () => {
    if (!containerRef.current || !window.kakao) return;
    window.kakao.maps.load(() => {
      mapRef.current = new window.kakao.maps.Map(containerRef.current!, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 4,
      });
      setReady(true);
    });
  };

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = markers.map((marker, i) => {
      const content = document.createElement("div");
      content.style.cssText =
        "background:var(--primary);color:#fff;font:700 11px system-ui;" +
        "width:22px;height:22px;border-radius:50% 50% 50% 0;display:grid;" +
        "place-items:center;transform:rotate(45deg);box-shadow:var(--shadow-sm);" +
        "border:2px solid var(--surface);cursor:pointer";
      const inner = document.createElement("span");
      inner.style.transform = "rotate(-45deg)";
      inner.textContent = String(i + 1);
      content.appendChild(inner);
      if (marker.onClick) content.addEventListener("click", marker.onClick);

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(marker.lat, marker.lng),
        content,
        yAnchor: 1.3,
      });
      overlay.setMap(mapRef.current);
      return overlay;
    });
  }, [ready, markers]);

  if (!KAKAO_MAP_KEY) {
    return (
      <div
        className="map"
        style={{
          height,
          display: "grid",
          placeItems: "center",
          padding: 16,
          textAlign: "center",
        }}
      >
        <p className="sub" style={{ margin: 0 }}>
          지도를 표시하려면 카카오맵 API 키가 필요해요.
          <br />
          .env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 설정해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="map">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={initMap}
      />
      <div ref={containerRef} style={{ width: "100%", height }} />
    </div>
  );
}
