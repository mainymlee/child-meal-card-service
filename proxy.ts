import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This is intentionally a session cookie. A fresh browser visit starts at the
// region/balance flow again, while navigation during the same visit stays in
// the app without repeatedly redirecting to onboarding.
const VISIT_STARTED_COOKIE = "hanki_visit_started";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/dong";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/onboarding")) return NextResponse.next();

  const visitStarted = request.cookies.get(VISIT_STARTED_COOKIE)?.value === "1";
  if (!visitStarted) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/dong";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\.\\w+$).*)"],
};
