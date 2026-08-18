import { readFile } from "node:fs/promises";
import path from "node:path";

const PROTOTYPE_FILE = "한끼_웹앱_v10 (1).html";
const KAKAO_KEY_DECLARATION = "var KAKAO_KEY = '';";

export async function GET() {
  const sourcePath = path.join(process.cwd(), PROTOTYPE_FILE);
  const source = await readFile(sourcePath, "utf8");
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

  // Keep the prototype itself immutable. The deploy-time key is inserted only
  // into the HTTP response so the same source file remains the design master.
  const html = source.replace(
    KAKAO_KEY_DECLARATION,
    `var KAKAO_KEY = ${JSON.stringify(kakaoKey)};`
  );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
