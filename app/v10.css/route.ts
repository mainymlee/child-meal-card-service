import { readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILE = "한끼_웹앱_v10 (1).html";

export async function GET() {
  const html = await readFile(path.join(process.cwd(), SOURCE_FILE), "utf8");
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];

  if (!css) return new Response("v10 stylesheet not found", { status: 500 });

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
