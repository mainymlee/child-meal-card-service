export interface OcrMenuCandidate {
  id: string;
  name: string;
  price: number;
  sourceLine: string;
}

const MIN_PRICE = 500;
const MAX_PRICE = 200_000;

function normalizeName(value: string): string {
  return value
    .replace(/[|_[\]{}<>]/g, " ")
    .replace(/^[^0-9A-Za-z가-힣]+|[^0-9A-Za-z가-힣]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(value: string): number {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export function extractMenuCandidates(text: string): OcrMenuCandidate[] {
  const candidates: OcrMenuCandidate[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.replace(/[·•…]/g, " ").replace(/\s+/g, " ").trim();
    if (!line) return;
    if (/\b0\d{1,2}[-\s)]?\d{3,4}[-\s]?\d{4}\b/.test(line)) return;
    const matches = [...line.matchAll(/([0-9][0-9,.\s]{2,})\s*원?/g)];
    const priceMatch = matches.at(-1);
    if (!priceMatch || priceMatch.index == null) return;
    const price = parsePrice(priceMatch[1]);
    if (price < MIN_PRICE || price > MAX_PRICE) return;
    const name = normalizeName(line.slice(0, priceMatch.index));
    if (name.length < 2 || /^\d+$/.test(name)) return;
    const key = `${name}|${price}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ id: `ocr-${index}-${price}`, name, price, sourceLine: rawLine });
  });
  return candidates;
}

export function validateMenuImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "이미지 파일만 선택할 수 있어요.";
  if (file.size > 10 * 1024 * 1024) return "이미지는 10MB 이하로 선택해 주세요.";
  return null;
}
