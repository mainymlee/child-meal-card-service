"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { DongButton } from "@/components/layout/DongButton";
import { TabBar } from "@/components/layout/TabBar";
import { KakaoMap, type MapMarker } from "@/components/map/KakaoMap";
import { CategorySegment, type CategoryFilter } from "@/components/CategorySegment";
import { StoreRow } from "@/components/StoreRow";
import { dongCenter } from "@/lib/persona";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useMealLog } from "@/lib/hooks/useMealLog";
import { useReports } from "@/lib/hooks/useReports";
import { distanceMeters, isOpenNow, storesInDong } from "@/lib/stores";
import { rankStores, verificationStatus } from "@/lib/ranking";
import { nowInSeoul } from "@/lib/time";

type FilterKey = "openNow" | "solo" | "togo" | "cheap";

const CHIP_LABELS: Record<FilterKey, string> = {
  openNow: "지금 열린 곳",
  solo: "혼밥 편함",
  togo: "포장",
  cheap: "1만원 이하",
};

const MAX_MARKERS = 14;

export default function ResultPage() {
  const router = useRouter();
  const dong = useDong() ?? DEFAULT_DONG;
  const { hourOverride } = useDemoHour();
  const mealLog = useMealLog();
  const reports = useReports();
  const now = useMemo(() => nowInSeoul(), []);
  const home = dongCenter(dong);

  const [cat, setCat] = useState<CategoryFilter>("all");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    openNow: true,
    solo: true,
    togo: false,
    cheap: true,
  });
  const [nearestFirst, setNearestFirst] = useState(false);

  const toggle = (key: FilterKey) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const all = storesInDong(dong);
  const counts = useMemo(() => {
    const openOnly = all.filter((s) => isOpenNow(s, now, hourOverride));
    const byCat2 = (c: string) => openOnly.filter((s) => s.cat2 === c).length;
    return {
      all: openOnly.length,
      kr: byCat2("kr"),
      cn: byCat2("cn"),
      wf: byCat2("wf"),
      bs: byCat2("bs"),
      cvs: byCat2("cvs"),
    };
  }, [all, now, hourOverride]);

  const list = useMemo(() => {
    const candidates = all.filter((s) => {
      if (cat !== "all" && s.cat2 !== cat) return false;
      if (filters.openNow && !isOpenNow(s, now, hourOverride)) return false;
      if (filters.solo && !s.badges.soloFriendly) return false;
      if (filters.togo && !s.badges.takeoutAvailable) return false;
      if (filters.cheap && !s.menu.some((m) => m.underBudget)) return false;
      return true;
    });
    return nearestFirst
      ? [...candidates].sort((a, b) => distanceMeters(home, a) - distanceMeters(home, b))
      : rankStores(candidates, { mealLog, home, reports });
  }, [all, cat, filters, nearestFirst, now, hourOverride, home, mealLog, reports]);

  const cvsOpenCount = all.filter((s) => s.cat2 === "cvs" && isOpenNow(s, now, hourOverride)).length;

  const markers: MapMarker[] = list.slice(0, MAX_MARKERS).map((store) => ({
    id: store.id,
    lat: store.lat,
    lng: store.lng,
    label: store.name,
    category: store.cat2,
    onClick: () => router.push(`/store/${store.id}`),
  }));

  return (
    <>
      <NavBar title="오늘 뭐 먹지?" backHref="/" extra={<DongButton />} />

      <div className="screenBody">
        <CategorySegment active={cat} counts={counts} onChange={setCat} />

        <KakaoMap center={home} markers={markers} locationLabel={dong} />

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

        {cat !== "cvs" && cvsOpenCount > 0 ? (
          <button className="cvsbanner" onClick={() => router.push("/cvs")}>
            <span className="ic">🏪</span>
            <div>
              <p className="t">편의점 조합 바로 보기</p>
              <p className="s">지금 열린 {cvsOpenCount}곳 · 밥+단백질+과일 1만 원 안 조합</p>
            </div>
          </button>
        ) : null}

        <div className="listhead">
          <p>
            {cat === "cvs" ? "가까운 편의점" : "지금 갈 수 있는 곳"}{" "}
            <b>{list.length}곳</b>
          </p>
          <span>{dong} 기준</span>
        </div>

        {list.length === 0 ? (
          <div className="empty">
            <div className="big">🌙</div>
            <h3>지금 조건에 맞는 곳이 없어요</h3>
            <p>
              {dong} 기준 · 조건을 바꾸거나,
              <br />
              근처 편의점 조합을 확인해보세요.
            </p>
            <button className="btn sm" style={{ width: "auto", padding: "0 22px", margin: "0 auto" }} onClick={() => router.push("/cvs")}>
              편의점에서 균형 있게 먹기
            </button>
          </div>
        ) : (
          list.map((store) => (
            <StoreRow
              key={store.id}
              store={store}
              distance={distanceMeters(home, store)}
              openNow={isOpenNow(store, now, hourOverride)}
              verification={verificationStatus(reports, store.id)}
              onClick={() => router.push(`/store/${store.id}`)}
            />
          ))
        )}
      </div>

      <TabBar />
    </>
  );
}
