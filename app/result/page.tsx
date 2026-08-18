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
  const [query, setQuery] = useState("");

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
      if (!matchesSearch(s, query)) return false;
      return true;
    });
    return nearestFirst
      ? [...candidates].sort((a, b) => distanceMeters(home, a) - distanceMeters(home, b))
      : rankStores(candidates, { mealLog, home, reports, feedback });
  }, [all, cat, filters, nearestFirst, now, hourOverride, home, mealLog, reports, feedback, query]);

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
            placeholder="가게·메뉴 검색 · 초성도 돼요 (ㅊㅁㅁㅇ)"
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
            <h3>{query ? "검색 결과가 없어요" : "지금 조건에 맞는 곳이 없어요"}</h3>
            <p>
              {query ? "다른 이름이나 초성으로 다시 찾아보세요." : <>{dong} 기준 · 조건을 바꾸거나,<br />근처 편의점 조합을 확인해보세요.</>}
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
