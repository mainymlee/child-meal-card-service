import assert from "node:assert/strict";
import { extractMenuCandidates } from "../lib/menuOcr.ts";

const basic = extractMenuCandidates("김치찌개 8,000원\n제육볶음 9 000\n영업시간 10:00");
assert.deepEqual(basic.map(({ name, price }) => ({ name, price })), [
  { name: "김치찌개", price: 8000 },
  { name: "제육볶음", price: 9000 },
]);

const filtered = extractMenuCandidates("전화 02-123-4567\n아메리카노 400원\n스테이크 250,000원");
assert.equal(filtered.length, 0, "가격 범위 밖 값과 전화번호는 제외해야 합니다.");

const duplicate = extractMenuCandidates("비빔밥 7,000\n비빔밥 7,000원");
assert.equal(duplicate.length, 1, "같은 메뉴와 가격은 중복 제거해야 합니다.");

console.log("Menu OCR parser validation passed.");
