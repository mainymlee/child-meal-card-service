import { readFileSync, writeFileSync } from "node:fs";

const storesFile = JSON.parse(readFileSync("data/stores.json", "utf8"));
const output = "data/menu-verification-queue.csv";
const PER_NEIGHBORHOOD = 6;

function csv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

const neighborhoods = ["후평동", "석사동", "퇴계동", "효자동"];
const rows = neighborhoods.flatMap((neighborhood) =>
  storesFile.stores
    .filter((store) =>
      store.neighborhood === neighborhood &&
      store.cat2 !== "cvs" &&
      store.phone &&
      store.menuSource !== "store-verified"
    )
    .sort((a, b) => {
      const sourcePriority = { "name-derived": 0, "category-derived": 1, unverified: 2 };
      return (sourcePriority[a.menuSource] ?? 3) - (sourcePriority[b.menuSource] ?? 3) ||
        a.name.localeCompare(b.name, "ko");
    })
    .slice(0, PER_NEIGHBORHOOD)
);

const headers = [
  "storeId",
  "가게명",
  "지역",
  "주소",
  "전화번호",
  "확인상태",
  "확인일",
  "메뉴1",
  "가격1",
  "메뉴2",
  "가격2",
  "메뉴3",
  "가격3",
  "출처URL",
  "비고",
];

const content = [
  headers.map(csv).join(","),
  ...rows.map((store) => [
    store.id,
    store.name,
    store.neighborhood,
    store.address,
    store.phone,
    "확인대기",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].map(csv).join(",")),
].join("\n");

writeFileSync(output, `${content}\n`, "utf8");
console.log(`Created ${output} with ${rows.length} stores.`);

