// One-time local data pipeline: CSV -> data/stores.json
// Run with: npm run geocode
//
// Reads the raw 춘천시 아동급식카드 가맹점 CSV, filters it down to 4 target
// neighborhoods, geocodes addresses via Kakao's REST API (if
// KAKAO_REST_API_KEY is set), and fabricates the fields the CSV doesn't
// provide (hours/menu/badges/cat2/grp/...) using a seeded PRNG so re-runs
// are stable.
//
// Without KAKAO_REST_API_KEY, falls back to jittered placeholder coordinates
// around each neighborhood's fallback center so the app has data to develop
// against. Re-run with a real key before relying on the map for anything real.
//
// NOTE: CATEGORY_TO_CAT2 / CATEGORY_TO_GRP_POOL below are plain-JS mirrors of
// lib/taxonomy.ts (this script runs as plain Node ESM, not through the
// TypeScript/Next build, so it can't import lib/*.ts directly) — keep both
// in sync if the taxonomy changes.

import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { deriveMenuProfile } from "./menu-rules.mjs";

const CSV_PATH = "data/raw/춘천시_아동급식카드_가맹점_20250714.csv";
const OUT_PATH = "data/stores.json";
const FAILURES_PATH = "scripts/geocode-failures.json";

// substring -> full neighborhood label used in addresses / Store.neighborhood
const NEIGHBORHOODS = {
  후평: "후평동",
  석사: "석사동",
  퇴계: "퇴계동",
  효자: "효자동",
};

const ALLOWED_CATEGORIES = [
  "한식",
  "일반대중음식",
  "중식",
  "제과점",
  "일식",
  "양식",
  "패스트푸드",
  "편의점",
];

const CATEGORY_TO_CAT2 = {
  한식: "kr",
  일반대중음식: "kr",
  중식: "cn",
  제과점: "bs",
  일식: "wf",
  양식: "wf",
  패스트푸드: "wf",
  편의점: "cvs",
};

const CATEGORY_TO_GRP_POOL = {
  한식: ["백반·정식", "국·찌개", "구이·볶음"],
  일반대중음식: ["백반·정식", "분식"],
  중식: ["중식"],
  제과점: ["베이커리"],
  일식: ["일식"],
  양식: ["양식·돈까스"],
  패스트푸드: ["양식·돈까스"],
  편의점: ["편의점"],
};

// Approximate neighborhood centers, Chuncheon — used only as the jitter
// origin for the no-API-key placeholder fallback.
const FALLBACK_CENTERS = {
  후평동: { lat: 37.879, lng: 127.7495 },
  석사동: { lat: 37.857, lng: 127.7435 },
  퇴계동: { lat: 37.858, lng: 127.735 },
  효자동: { lat: 37.8725, lng: 127.7395 },
};

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || "";

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function loadRows() {
  const raw = stripBom(readFileSync(CSV_PATH, "utf-8"));
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function filterRows(rows) {
  const result = [];
  for (const r of rows) {
    const addr = r["소재지도로명주소"] || "";
    if (!ALLOWED_CATEGORIES.includes(r["업종명"])) continue;
    const hit = Object.entries(NEIGHBORHOODS).find(([sub]) => addr.includes(sub));
    if (!hit) continue;
    result.push({ row: r, neighborhood: hit[1] });
  }
  return result;
}

function dedupe(entries) {
  const seen = new Set();
  return entries.filter(({ row }) => {
    const key = `${row["가맹점명"]}|${row["소재지도로명주소"]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- seeded RNG (mulberry32) so fabricated fields are stable across runs ---
function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "store"
  );
}

const HOURS_TEMPLATES = {
  한식: [
    { open: "08:00", close: "21:00" },
    { open: "10:00", close: "20:00" },
  ],
  일반대중음식: [
    { open: "09:00", close: "21:30" },
    { open: "10:00", close: "20:00" },
  ],
  중식: [{ open: "10:30", close: "21:00" }],
  제과점: [
    { open: "07:00", close: "20:00" },
    { open: "08:00", close: "21:00" },
  ],
  일식: [{ open: "11:00", close: "21:00" }],
  양식: [{ open: "10:30", close: "21:30" }],
  패스트푸드: [{ open: "10:00", close: "22:00" }],
  편의점: [{ open: "00:00", close: "24:00" }],
};

const COUNTER_TEMPLATES = {
  한식: ["테이블 주문 · 혼밥 손님 많음", "테이블 주문 · 반찬 리필", "카운터 주문 · 혼밥 편함"],
  일반대중음식: ["카운터 주문 · 포장 가능", "테이블 주문 · 아이 놀이방"],
  중식: ["테이블 주문 · 포장 가능", "카운터 주문 · 양 많음"],
  제과점: ["카운터 주문 · 포장 위주"],
  일식: ["카운터 주문 · 1인석 있음"],
  양식: ["태블릿 주문 · 1인석 있음", "카운터 주문 · 포장 가능"],
  패스트푸드: ["카운터 주문 · 포장 위주"],
  편의점: ["셀프 계산 가능"],
};

function fabricate(row, neighborhood, rng) {
  const category = row["업종명"];
  const isCvs = category === "편의점";

  const hoursOptions = HOURS_TEMPLATES[category] || HOURS_TEMPLATES["한식"];
  const hours = hoursOptions[Math.floor(rng() * hoursOptions.length)];

  const menuProfile = deriveMenuProfile(row["가맹점명"], category);
  const menu = menuProfile.menu;

  const soloFriendly = isCvs ? true : rng() < 0.8;
  const takeoutAvailable = isCvs ? true : rng() < 0.85;
  const paymentConfirmed = rng() < 0.7;
  const paymentConfirmedDate = paymentConfirmed
    ? `2026-08-${String(1 + Math.floor(rng() * 17)).padStart(2, "0")}`
    : null;

  const closedDays = !isCvs && rng() < 0.3 ? [Math.floor(rng() * 7)] : [];
  const breakTime =
    !isCvs && (category === "한식" || category === "일반대중음식") && rng() < 0.1
      ? "14–16시 브레이크"
      : null;
  const hoursEst = isCvs ? false : rng() < 0.3;

  const counterPool = COUNTER_TEMPLATES[category] || COUNTER_TEMPLATES["한식"];
  const counterDescription = counterPool[Math.floor(rng() * counterPool.length)];

  const grpPool = CATEGORY_TO_GRP_POOL[category] || CATEGORY_TO_GRP_POOL["한식"];
  const grp = menuProfile.grp ?? grpPool[Math.floor(rng() * grpPool.length)];
  const cat2 = CATEGORY_TO_CAT2[category] || "kr";

  return {
    hours,
    menu,
    menuSource: menuProfile.menuSource,
    cat2,
    grp,
    closedDays,
    breakTime,
    hoursEst,
    counterDescription,
    badges: {
      soloFriendly,
      takeoutAvailable,
      paymentConfirmed,
      paymentConfirmedDate,
    },
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(address) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
    address
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

async function geocodeKeyword(name, neighborhood) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
    `${name} 춘천 ${neighborhood}`
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

function fallbackJitter(neighborhood, seedRng) {
  // ~ +/- 900m box around the neighborhood center — placeholder only.
  const center = FALLBACK_CENTERS[neighborhood];
  const dLat = (seedRng() - 0.5) * 0.016;
  const dLng = (seedRng() - 0.5) * 0.016;
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

async function main() {
  const entries = dedupe(filterRows(loadRows()));
  console.log(`Filtered to ${entries.length} candidate rows across ${Object.values(NEIGHBORHOODS).join("/")}.`);

  const usingKakao = Boolean(KAKAO_REST_API_KEY);
  console.log(
    usingKakao
      ? "KAKAO_REST_API_KEY found — geocoding against real addresses."
      : "No KAKAO_REST_API_KEY set — generating placeholder coordinates. Set the key in .env.local and re-run for real geocoding before deploying."
  );

  const stores = [];
  const failures = [];

  for (const { row, neighborhood } of entries) {
    const name = row["가맹점명"];
    const address = row["소재지도로명주소"];
    const seed = hashString(`${name}|${address}`);
    const rng = mulberry32(seed);

    let coords = null;
    if (usingKakao) {
      coords = await geocodeAddress(address);
      if (!coords) coords = await geocodeKeyword(name, neighborhood);
      await sleep(120);
      if (!coords) {
        failures.push({ name, address, neighborhood });
        continue;
      }
    } else {
      coords = fallbackJitter(neighborhood, rng);
    }

    const {
      hours,
      menu,
      menuSource,
      cat2,
      grp,
      closedDays,
      breakTime,
      hoursEst,
      counterDescription,
      badges,
    } = fabricate(row, neighborhood, rng);

    stores.push({
      id: `${slugify(name)}-${seed.toString(36).slice(0, 6)}`,
      name,
      category: row["업종명"],
      cat2,
      grp,
      neighborhood,
      address,
      phone: row["전화번호"] || null,
      lat: coords.lat,
      lng: coords.lng,
      hours,
      closedDays,
      breakTime,
      hoursEst,
      counterDescription,
      badges,
      menu,
      menuSource,
    });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    sourceFile: CSV_PATH,
    count: stores.length,
    placeholderCoordinates: !usingKakao,
    menuRefinedAt: new Date().toISOString(),
    menuSourceCounts: stores.reduce((counts, store) => {
      counts[store.menuSource] = (counts[store.menuSource] || 0) + 1;
      return counts;
    }, {}),
    stores,
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
  console.log(`Wrote ${stores.length} stores to ${OUT_PATH}.`);

  const byDong = {};
  stores.forEach((s) => {
    byDong[s.neighborhood] = (byDong[s.neighborhood] || 0) + 1;
  });
  console.log("Per-neighborhood counts:", byDong);

  if (failures.length) {
    writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2), "utf-8");
    console.log(`${failures.length} rows failed to geocode — see ${FAILURES_PATH}.`);
  }
}

main();
