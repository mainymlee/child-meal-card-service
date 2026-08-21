import { readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILE = "docs/prototypes/한끼_웹앱_v10.html";

export async function GET() {
  try {
    const html = await readFile(path.join(process.cwd(), SOURCE_FILE), "utf8");
    const encoded = html.match(/var APP_LOGO='data:image\/png;base64,([^']+)'/)?.[1];

    if (!encoded) return new Response("v10 logo not found", { status: 500 });

    return new Response(Buffer.from(encoded, "base64"), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=0, s-maxage=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to load v10 app logo", error);
    return new Response("v10 logo unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
