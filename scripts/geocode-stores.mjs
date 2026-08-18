// One-time local data pipeline: CSV -> data/stores.json
// Run with: npm run geocode
//
// Reads the raw 춘천시 아동급식카드 가맹점 CSV, filters it down to a demo-sized
// neighborhood subset, geocodes addresses via Kakao's REST API (if
// KAKAO_REST_API_KEY is set), and fabricates the fields the CSV doesn't
// provide (hours/menu/badges) using a seeded PRNG so re-runs are stable.
//
// Without KAKAO_REST_API_KEY, falls back to jittered placeholder coordinates
// around the 후평동 neighborhood center so the app has data to develop against.
// Re-run with a real key before relying on the map for anything real.

import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const CSV_PATH = "data/raw/춘천시_아동급식카드_가맹점_20250714.csv";
const OUT_PATH = "data/stores.json";
const FAILURES_PATH = "scripts/geocode-failures.json";

const NEIGHBORHOOD = "후평";
const ALLOWED_CATEGORIES = [
  "한식",
  "일반대중음식",
  "중식",
  "제과점",
  "일식",
  "양식",
  "패스트푸드",
];

// Approximate center of 후평동, Chuncheon — used only as the jitter origin
// for the no-API-key placeholder fallback.
const FALLBACK_CENTER = { lat: 37.8814, lng: 127.7269 };

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || "";

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function loadRows() {
  const raw = stripBom(readFileSync(CSV_PATH, "utf-8"));
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function filterRows(rows) {
  return rows.filter(
    (r) =>
      (r["소재지도로명주소"] || "").includes(NEIGHBORHOOD) &&
      ALLOWED_CATEGORIES.includes(r["업종명"])
  );
}

function dedupe(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r["가맹점명"]}|${r["소재지도로명주소"]}`;
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
};

const MENU_TEMPLATES = {
  한식: [
    ["제육백반", 9000],
    ["된장찌개 정식", 8500],
    ["고등어구이 백반", 9500],
    ["김치찌개", 8000],
    ["순두부찌개", 8500],
    ["불고기 정식", 12000],
    ["비빔밥", 8500],
    ["갈비탕", 11000],
  ],
  일반대중음식: [
    ["돈까스", 9000],
    ["오므라이스", 8500],
    ["카레라이스", 8000],
    ["떡볶이 세트", 7000],
    ["김밥+라면", 7500],
    ["돌솥비빔밥", 9500],
  ],
  중식: [
    ["짜장면", 7000],
    ["짬뽕", 8500],
    ["볶음밥", 8000],
    ["탕수육(소)", 13000],
    ["짜장밥", 7500],
  ],
  제과점: [
    ["샌드위치 세트", 7000],
    ["단팥빵+우유", 4500],
    ["크로크무슈", 6500],
    ["베이글 세트", 7500],
  ],
  일식: [
    ["돈부리", 9500],
    ["우동세트", 8500],
    ["규동", 9000],
    ["초밥세트", 12000],
  ],
  양식: [
    ["토마토파스타", 9500],
    ["함박스테이크", 11500],
    ["리조또", 10500],
  ],
  패스트푸드: [
    ["햄버거 세트", 7500],
    ["치킨버거 세트", 8000],
    ["샌드위치 세트", 7000],
  ],
};

function fabricate(row, rng) {
  const category = row["업종명"];
  const hoursOptions = HOURS_TEMPLATES[category] || HOURS_TEMPLATES["한식"];
  const hours = hoursOptions[Math.floor(rng() * hoursOptions.length)];

  const menuPool = MENU_TEMPLATES[category] || MENU_TEMPLATES["한식"];
  const shuffled = [...menuPool].sort(() => rng() - 0.5);
  const count = 3 + Math.floor(rng() * 2); // 3-4 items
  const menu = shuffled.slice(0, count).map(([name, price]) => ({
    name,
    price,
    underBudget: price <= 10000,
  }));

  const soloFriendly = rng() < 0.8;
  const takeoutAvailable = rng() < 0.85;
  const paymentConfirmed = rng() < 0.7;
  const paymentConfirmedDate = paymentConfirmed
    ? `2026-08-${String(1 + Math.floor(rng() * 17)).padStart(2, "0")}`
    : null;

  return {
    hours,
    menu,
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

async function geocodeKeyword(name) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
    `${name} 춘천 후평동`
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

function fallbackJitter(seedRng) {
  // ~ +/- 900m box around the neighborhood center — placeholder only.
  const dLat = (seedRng() - 0.5) * 0.016;
  const dLng = (seedRng() - 0.5) * 0.016;
  return { lat: FALLBACK_CENTER.lat + dLat, lng: FALLBACK_CENTER.lng + dLng };
}

async function main() {
  const rows = dedupe(filterRows(loadRows()));
  console.log(`Filtered to ${rows.length} candidate rows in 후평동.`);

  const usingKakao = Boolean(KAKAO_REST_API_KEY);
  console.log(
    usingKakao
      ? "KAKAO_REST_API_KEY found — geocoding against real addresses."
      : "No KAKAO_REST_API_KEY set — generating placeholder coordinates. Set the key in .env.local and re-run for real geocoding before deploying."
  );

  const stores = [];
  const failures = [];

  for (const row of rows) {
    const name = row["가맹점명"];
    const address = row["소재지도로명주소"];
    const seed = hashString(`${name}|${address}`);
    const rng = mulberry32(seed);

    let coords = null;
    if (usingKakao) {
      coords = await geocodeAddress(address);
      if (!coords) coords = await geocodeKeyword(name);
      await sleep(120);
      if (!coords) {
        failures.push({ name, address });
        continue;
      }
    } else {
      coords = fallbackJitter(rng);
    }

    const { hours, menu, badges } = fabricate(row, rng);
    stores.push({
      id: `${slugify(name)}-${seed.toString(36).slice(0, 6)}`,
      name,
      category: row["업종명"],
      address,
      phone: row["전화번호"] || null,
      lat: coords.lat,
      lng: coords.lng,
      hours,
      badges,
      menu,
    });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    sourceFile: CSV_PATH,
    count: stores.length,
    placeholderCoordinates: !usingKakao,
    stores,
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
  console.log(`Wrote ${stores.length} stores to ${OUT_PATH}.`);

  if (failures.length) {
    writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2), "utf-8");
    console.log(`${failures.length} rows failed to geocode — see ${FAILURES_PATH}.`);
  }
}

main();
