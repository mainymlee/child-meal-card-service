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
import { useMealFeedback } from "@/lib/hooks/useMealFeedback";
import { useReports } from "@/lib/hooks/useReports";
import { useBalance } from "@/lib/hooks/useBalance";
import { useExpMode } from "@/lib/hooks/useExpMode";
import { distanceMeters, isOpenNow, storesInDong, storesNear } from "@/lib/stores";
import { rankStores, verificationStatus } from "@/lib/ranking";
import { nowInSeoul, toSeoulDate } from "@/lib/time";
import { calcBalancePlan } from "@/lib/balance";
import { recommendMeals } from "@/lib/recommendation/recommend";
import { DEFAULT_FOOD_PREFERENCES } from "@/lib/recommendation/types";
import type { MenuItem } from "@/lib/types";
import { useAppLocation } from "@/lib/location/LocationProvider";

type FilterKey = "openNow" | "solo" | "togo" | "cheap";

const CHIP_LABELS: Record<FilterKey, string> = {
  openNow: "지금 열린 곳",
  solo: "혼밥 편함",
  togo: "포장",
  cheap: "1만원 이하",
};

const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const CHOSEONG_NORMALIZE: Record<string, string> = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };

function compact(value: string) {
  return value.replace(/\s/g, "").toLocaleLowerCase("ko-KR");
}

function choseong(value: string) {
  return [...value].map((character) => {
    const code = character.charCodeAt(0);
    return code >= 0xac00 && code <= 0xd7a3
      ? CHOSEONG[Math.floor((code - 0xac00) / 588)]
      : character === " " ? "" : character;
  }).join("");
}

function normalizeChoseong(value: string) {
  return [...value].map((character) => CHOSEONG_NORMALIZE[character] ?? character).join("");
}

function matchesSearch(store: ReturnType<typeof storesInDong>[number], query: string) {
  const normalizedQuery = compact(query);
  if (!normalizedQuery) return true;
  const searchable = [store.name, store.address, ...store.menu.map((menu) => menu.name)];
  return searchable.some((value) => {
    if (compact(value).includes(normalizedQuery)) return true;
    return normalizeChoseong(choseong(value)).includes(normalizeChoseong(normalizedQuery));
  });
}

export default function ResultPage() {
  const router = useRouter();
  const dong = useDong() ?? DEFAULT_DONG;
  const { hourOverride } = useDemoHour();
  const mealLog = useMealLog();
  const feedback = useMealFeedback();
  const reports = useReports();
  const { balance, lastUpdatedISO } = useBalance();
  const expMode = useExpMode();
  const now = useMemo(() => nowInSeoul(), []);
  const home = useMemo(() => dongCenter(dong), [dong]);
  const { gpsLocation, setGpsLocation } = useAppLocation();
  const origin = useMemo(() => gpsLocation ?? home, [gpsLocation, home]);
  const balancePlan = useMemo(
    () => calcBalancePlan(
      balance,
      now,
      expMode,
      lastUpdatedISO ? toSeoulDate(new Date(lastUpdatedISO)) : null
    ),
    [balance, now, expMode, lastUpdatedISO]
  );

  const [cat, setCat] = useState<CategoryFilter>("all");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    openNow: true,
    solo: true,
    togo: false,
    cheap: true,
  });
  const [nearestFirst, setNearestFirst] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (key: FilterKey) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const all = useMemo(
    () => gpsLocation ? storesNear(gpsLocation) : storesInDong(dong),
    [gpsLocation, dong]
  );
  const counts = useMemo(() => {
    const visible = all.filter((s) => {
      if (filters.openNow && !isOpenNow(s, now, hourOverride)) return false;
      if (filters.solo && !s.badges.soloFriendly) return false;
      if (filters.togo && !s.badges.takeoutAvailable) return false;
      if (filters.cheap && !s.menu.some((m) => m.underBudget)) return false;
      return matchesSearch(s, query);
    });
    const byCat2 = (c: string) => visible.filter((s) => s.cat2 === c).length;
    return {
      all: visible.length,
      kr: byCat2("kr"),
      cn: byCat2("cn"),
      wf: byCat2("wf"),
      bs: byCat2("bs"),
      cvs: byCat2("cvs"),
    };
  }, [all, filters, query, now, hourOverride]);

  const { list, recommendedMenus } = useMemo(() => {
    const candidates = all.filter((s) => {
      if (cat !== "all" && s.cat2 !== cat) return false;
      if (filters.openNow && !isOpenNow(s, now, hourOverride)) return false;
      if (filters.solo && !s.badges.soloFriendly) return false;
      if (filters.togo && !s.badges.takeoutAvailable) return false;
      if (filters.cheap && !s.menu.some((m) => m.underBudget)) return false;
      if (!matchesSearch(s, query)) return false;
      return true;
    });
    if (nearestFirst || cat === "cvs") {
      const sorted = nearestFirst
        ? [...candidates].sort((a, b) => distanceMeters(origin, a) - distanceMeters(origin, b))
        : rankStores(candidates, { mealLog, home: origin, reports, feedback });
      return { list: sorted, recommendedMenus: new Map<string, MenuItem>() };
    }

    const recommendations = recommendMeals(candidates, {
      neighborhood: dong,
      spendingPlan: {
        remainingBalance: balance,
        remainingDays: balancePlan.remainingDays,
        dailyRecommended: balancePlan.dailyRecommended,
        recommendedUpperBound: balancePlan.recommendedUpperBound,
        officialDailyLimit: null,
        expiringAmount: balancePlan.expiringAmount,
        cycleEnd: balancePlan.cycleEnd.toISOString(),
      },
      diningMode: filters.solo ? "solo" : "together",
      serviceMode: filters.togo ? "takeout" : "any",
      now,
      hourOverride,
      location: { ...origin, source: gpsLocation ? "gps" : "dong-center" },
      mealHistory: mealLog,
      feedback,
      preferences: DEFAULT_FOOD_PREFERENCES,
      reports,
    }, candidates.length);
    const recommendedIds = new Set(recommendations.map((item) => item.store.id));
    const remaining = rankStores(
      candidates.filter((store) => !recommendedIds.has(store.id)),
      { mealLog, home: origin, reports, feedback }
    );
    return {
      list: [...recommendations.map((item) => item.store), ...remaining],
      recommendedMenus: new Map(recommendations.map((item) => [
        item.store.id,
        item.store.menu.find((menu) => menu.name === item.menuName)!,
      ])),
    };
  }, [all, cat, filters, nearestFirst, now, hourOverride, origin, gpsLocation, mealLog, reports, feedback, query, dong, balance, balancePlan]);

  const cvsOpenCount = all.filter((s) => s.cat2 === "cvs" && isOpenNow(s, now, hourOverride)).length;

  const mapStores = list;
  const markers: MapMarker[] = useMemo(() => mapStores.map((store) => ({
      id: store.id,
      lat: store.lat,
      lng: store.lng,
      label: store.name,
      category: store.cat2,
      onClick: () => router.push(`/store/${store.id}`),
    })), [mapStores, router]);

  return (
    <>
      <NavBar title="오늘 뭐 먹지?" backHref="/home" extra={<DongButton />} />

      <div className="screenBody">
        <div className="searchbar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="가게·메뉴 검색, 초성도 돼요 (ㅊㅁㅁㅇ)"
            autoComplete="off"
            aria-label="가게 또는 메뉴 검색"
          />
          {query ? (
            <button className="clear" aria-label="검색어 지우기" onClick={() => setQuery("")}>
              ×
            </button>
          ) : null}
        </div>

        <CategorySegment active={cat} counts={counts} onChange={setCat} />

        <KakaoMap
          center={origin}
          markers={markers}
          locationLabel={`${gpsLocation ? "현재 위치" : dong}·조건에 맞는 ${markers.length}곳`}
          userLocation={gpsLocation}
          onLocationFound={setGpsLocation}
        />

        <div className="chips">
          {(Object.keys(CHIP_LABELS) as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`chip ${filters[key] ? "on" : ""}`}
              aria-pressed={filters[key]}
              onClick={() => toggle(key)}
            >
              {CHIP_LABELS[key]}
            </button>
          ))}
          <button
            className={`chip ${nearestFirst ? "on" : ""}`}
            aria-pressed={nearestFirst}
            onClick={() => setNearestFirst((v) => !v)}
          >
            가까운 순
          </button>
        </div>
        <p className="sub" aria-live="polite" style={{ margin: "-3px 2px 10px", fontSize: 12.5 }}>
          켜진 필터 {Object.values(filters).filter(Boolean).length}개가 목록·지도·카테고리 수에 함께 적용돼요.
        </p>

        {cat !== "cvs" && cvsOpenCount > 0 ? (
          <button className="cvsbanner" onClick={() => router.push("/cvs")}>
            <span className="ic">🏪</span>
            <div>
              <p className="t">편의점 조합 바로 보기</p>
              <p className="s">지금 열린 {cvsOpenCount}곳, 밥+단백질+과일 1만 원 안 조합</p>
            </div>
          </button>
        ) : null}

        <div className="listhead">
          <p>
            {cat === "cvs" ? "가까운 편의점" : "지금 갈 수 있는 곳"}{" "}
            <b>{list.length}곳</b>
          </p>
          <span>{nearestFirst ? "가까운 순" : cat === "cvs" ? `${gpsLocation ? "현재 위치" : dong} 기준` : "맞춤 추천순"}</span>
        </div>

        {list.length === 0 ? (
          <div className="empty">
            <div className="big">🌙</div>
            <h3>{query ? "검색 결과가 없어요" : "지금 조건에 맞는 곳이 없어요"}</h3>
            <p>
              {query ? "다른 이름이나 초성으로 다시 찾아보세요." : <>{gpsLocation ? "현재 위치" : dong} 기준으로 조건을 바꾸거나,<br />근처 편의점 조합을 확인해보세요.</>}
            </p>
            {query ? (
              <button className="btn sm" style={{ width: "auto", padding: "0 22px", margin: "0 auto" }} onClick={() => setQuery("")}>
                검색어 지우기
              </button>
            ) : (
              <button className="btn sm" style={{ width: "auto", padding: "0 22px", margin: "0 auto" }} onClick={() => router.push("/cvs")}>
                편의점에서 균형 있게 먹기
              </button>
            )}
          </div>
        ) : (
          list.map((store) => (
            <StoreRow
              key={store.id}
              store={store}
              distance={distanceMeters(origin, store)}
              openNow={isOpenNow(store, now, hourOverride)}
              verification={verificationStatus(reports, store)}
              recommendedItem={recommendedMenus.get(store.id)}
              onClick={() => router.push(`/store/${store.id}`)}
            />
          ))
        )}
      </div>

      <TabBar />
    </>
  );
}
