"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SimplifiedCategory } from "@/lib/types";
import { ExpandIcon, ShrinkIcon, TargetIcon } from "@/components/icons";
import { useToast } from "@/lib/overlay/OverlayProvider";

const CATEGORY_EMOJI = {
  kr: "🍚",
  cn: "🥡",
  wf: "🍴",
  bs: "🍢",
  cvs: "🏪",
} as const;

const CATEGORY_COLOR: Record<SimplifiedCategory, string> = {
  kr: "#f7d354",
  cn: "#f7cfdc",
  wf: "#c7ddf5",
  bs: "#dcd3f7",
  cvs: "#fbf7ee",
};

const STORE_MARKER_IMAGES = new Map<SimplifiedCategory, kakao.maps.MarkerImage>();

function createStoreMarkerImage(category: SimplifiedCategory) {
  const cached = STORE_MARKER_IMAGES.get(category);
  if (cached) return cached;
  const color = CATEGORY_COLOR[category];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
    <path d="M21 44 8 27C1 18 5 4 17 2c13-2 21 8 18 19-2 7-8 14-14 23Z" fill="#17151c" opacity=".22"/>
    <path d="M19 41 6 24C-1 15 4 2 16 1c12-1 20 9 17 19-2 7-8 14-14 21Z" fill="${color}" stroke="#17151c" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="17" cy="16" r="6" fill="#fff" stroke="#17151c" stroke-width="2.5"/>
  </svg>`;
  const image = new window.kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new window.kakao.maps.Size(38, 46),
    { offset: new window.kakao.maps.Point(19, 41) }
  );
  STORE_MARKER_IMAGES.set(category, image);
  return image;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  category?: SimplifiedCategory;
  onClick?: () => void;
}

interface KakaoMapProps {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  height?: number;
  locationLabel?: string;
  userLocation?: { lat: number; lng: number } | null;
  onLocationFound?: (location: { lat: number; lng: number; accuracy: number }) => void;
}

const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

export function KakaoMap({
  center,
  markers,
  height = 214,
  locationLabel,
  userLocation = null,
  onLocationFound,
}: KakaoMapProps) {
  const { show } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapHeight = expanded ? 342 : height;

  const moveToCenter = useCallback(() => {
    if (!mapRef.current || !window.kakao) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng]);

  const moveToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      show("이 기기에서는 위치 기능을 사용할 수 없어요.");
      return;
    }
    if (locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        };
        onLocationFound?.(location);
        if (mapRef.current && window.kakao) {
          mapRef.current.setCenter(new window.kakao.maps.LatLng(location.lat, location.lng));
        }
        setLocating(false);
        show("현재 위치를 기준으로 다시 추천했어요.");
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          show("위치 권한이 필요해요. 브라우저 설정에서 허용해 주세요.");
        } else if (error.code === error.TIMEOUT) {
          show("현재 위치를 찾는 데 시간이 걸려요. 다시 시도해 주세요.");
        } else {
          show("현재 위치를 확인하지 못했어요.");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }, [locating, onLocationFound, show]);

  const initMap = () => {
    if (!containerRef.current || !window.kakao) return;
    window.kakao.maps.load(() => {
      mapRef.current = new window.kakao.maps.Map(containerRef.current!, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 4,
      });
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map: mapRef.current,
        averageCenter: true,
        minLevel: 3,
        styles: [{
          width: "44px",
          height: "44px",
          background: "#f7d354",
          border: "2.5px solid #17151c",
          borderRadius: "50%",
          boxShadow: "3px 3px 0 #17151c",
          color: "#17151c",
          textAlign: "center",
          fontSize: "13px",
          fontWeight: "900",
          lineHeight: "39px",
        }],
      });
      setReady(true);
    });
  };

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    clustererRef.current?.clear();
    markersRef.current.forEach((marker) => marker.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    markersRef.current = markers.map((marker) => {
      const mapMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(marker.lat, marker.lng),
        title: `${CATEGORY_EMOJI[marker.category ?? "kr"]} ${marker.label}`,
        clickable: Boolean(marker.onClick),
        image: createStoreMarkerImage(marker.category ?? "kr"),
      });
      if (marker.onClick) {
        window.kakao.maps.event.addListener(mapMarker, "click", marker.onClick);
      }
      return mapMarker;
    });
    clustererRef.current?.addMarkers(markersRef.current);

    if (userLocation) {
      const content = document.createElement("div");
      content.className = "userLocationMarker";
      content.setAttribute("role", "img");
      content.setAttribute("aria-label", "내 현재 위치");
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        content,
        zIndex: 10,
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    }

    return () => {
      clustererRef.current?.clear();
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [ready, markers, userLocation]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.relayout();
    moveToCenter();
  }, [expanded, moveToCenter, ready]);

  if (!KAKAO_MAP_KEY) {
    return (
      <div
        className="mapwrap round"
        style={{
          height: mapHeight,
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
        className="mapwrap round"
        role="status"
        style={{ height: mapHeight, display: "grid", placeItems: "center", padding: 16, textAlign: "center" }}
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
    <div className={`mapwrap round${expanded ? " big" : ""}`} style={{ height: mapHeight }}>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`}
        strategy="afterInteractive"
        onReady={() => {
          setLoadFailed(false);
          initMap();
        }}
        onError={() => setLoadFailed(true)}
      />
      <div ref={containerRef} className="mapbox" style={{ width: "100%", height: mapHeight }} />
      {locationLabel ? <div className="maptip">{locationLabel}</div> : null}
      <div className="mapctl">
        <button
          type="button"
          aria-label={expanded ? "지도 작게 보기" : "지도 크게 보기"}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <ShrinkIcon /> : <ExpandIcon />}
        </button>
        <button
          type="button"
          className={locating ? "locating" : ""}
          aria-label={locating ? "현재 위치 찾는 중" : "내 위치로 이동"}
          aria-busy={locating}
          disabled={locating}
          onClick={moveToCurrentLocation}
        >
          <TargetIcon />
        </button>
      </div>
    </div>
  );
}
