"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { TabBar } from "@/components/layout/TabBar";
import { KakaoMap, type MapMarker } from "@/components/map/KakaoMap";
import { StoreBadgePills } from "@/components/Pill";
import { PERSONA_HOME } from "@/lib/persona";
import {
  STORES,
  cheapestUnderBudgetItem,
  distanceMeters,
  isOpenNow,
  walkingMinutes,
} from "@/lib/stores";
import { nowInSeoul } from "@/lib/time";

type FilterKey = "openNow" | "solo" | "takeout" | "underBudget";

const CHIP_LABELS: Record<FilterKey, string> = {
  openNow: "지금 열린 곳",
  solo: "혼밥 편함",
  takeout: "포장",
  underBudget: "1만원 이하",
};

const MAX_MARKERS = 12;

export default function ResultPage() {
  const router = useRouter();
  const now = useMemo(() => nowInSeoul(), []);
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    openNow: true,
    solo: true,
    takeout: false,
    underBudget: false,
  });
  const [nearestFirst, setNearestFirst] = useState(true);

  const toggle = (key: FilterKey) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }));

  const list = useMemo(() => {
    const candidates = STORES.filter((s) => {
      if (filters.openNow && !isOpenNow(s, now)) return false;
      if (filters.solo && !s.badges.soloFriendly) return false;
      if (filters.takeout && !s.badges.takeoutAvailable) return false;
      if (filters.underBudget && !s.menu.some((m) => m.underBudget)) return false;
      return true;
    });

    const withDistance = candidates.map((store) => ({
      store,
      distance: distanceMeters(PERSONA_HOME, store),
    }));

    withDistance.sort((a, b) =>
      nearestFirst ? a.distance - b.distance : a.store.name.localeCompare(b.store.name)
    );

    return withDistance;
  }, [filters, nearestFirst, now]);

  const markers: MapMarker[] = list.slice(0, MAX_MARKERS).map(({ store }) => ({
    id: store.id,
    lat: store.lat,
    lng: store.lng,
    label: store.name,
    onClick: () => router.push(`/store/${store.id}`),
  }));

  return (
    <>
      <NavBar title="오늘 뭐 먹지?" backHref="/" />

      <div className="screenBody">
        <div className="chips">
          {(Object.keys(CHIP_LABELS) as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`chip ${filters[key] ? "on" : ""}`}
              onClick={() => toggle(key)}
            >
              {CHIP_LABELS[key]}
            </button>
          ))}
          <button
            className={`chip ${nearestFirst ? "on" : ""}`}
            onClick={() => setNearestFirst((v) => !v)}
          >
            가까운 순
          </button>
        </div>

        <KakaoMap center={PERSONA_HOME} markers={markers} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            margin: "2px 0 2px",
          }}
        >
          <p className="lbl" style={{ margin: 0 }}>
            지금 갈 수 있는 곳 <b style={{ color: "var(--primary)" }}>{list.length}곳</b>
          </p>
          <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>후평동 기준</span>
        </div>

        {list.length === 0 ? (
          <div className="card flat">
            <p className="sub" style={{ margin: 0 }}>
              조건에 맞는 가게가 없어. 필터를 조금 풀어볼래?
            </p>
          </div>
        ) : (
          list.map(({ store, distance }) => {
            const item = cheapestUnderBudgetItem(store);
            return (
              <button
                key={store.id}
                className="store"
                onClick={() => router.push(`/store/${store.id}`)}
              >
                <div>
                  <p className="nm">{store.name}</p>
                  <p className="mt">
                    {store.category} · {item.name} {item.price.toLocaleString()}원
                  </p>
                  <StoreBadgePills
                    openNow={isOpenNow(store, now)}
                    soloFriendly={store.badges.soloFriendly}
                    takeoutAvailable={store.badges.takeoutAvailable}
                    paymentConfirmed={store.badges.paymentConfirmed}
                  />
                </div>
                <div className="dist">
                  <b>{distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}</b>
                  도보 {walkingMinutes(distance)}분
                </div>
              </button>
            );
          })
        )}
      </div>

      <TabBar />
    </>
  );
}
