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
  const [loadFailed, setLoadFailed] = useState(false);

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
      const content = document.createElement("button");
      content.type = "button";
      content.setAttribute("aria-label", `${marker.label} 상세 보기`);
      content.title = marker.label;
      content.style.cssText =
        "background:var(--primary);color:#fff;font:700 11px system-ui;" +
        "width:22px;height:22px;border-radius:50% 50% 50% 0;display:grid;" +
        "place-items:center;transform:rotate(45deg);box-shadow:var(--shadow-sm);" +
        "border:2px solid var(--surface);cursor:pointer;padding:0";
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

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [ready, markers]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng, ready]);

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
          지금은 지도를 불러올 수 없어요.
          <br />
          아래 가게 목록은 그대로 이용할 수 있어요.
        </p>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div
        className="map"
        role="status"
        style={{ height, display: "grid", placeItems: "center", padding: 16, textAlign: "center" }}
      >
        <p className="sub" style={{ margin: 0 }}>
          지도를 불러오지 못했어요.
          <br />
          인터넷 연결을 확인하거나 아래 목록을 이용해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="map">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={() => {
          setLoadFailed(false);
          initMap();
        }}
        onError={() => setLoadFailed(true)}
      />
      <div ref={containerRef} style={{ width: "100%", height }} />
    </div>
  );
}
