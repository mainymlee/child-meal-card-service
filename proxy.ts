import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Client-only localStorage can't be read at the middleware/server layer, so
// onboarding completion is mirrored into a plain (non-httpOnly) cookie purely
// so this redirect can happen server-side with no flash-of-onboarding on every
// return visit. localStorage stays the authoritative source of truth — see
// lib/onboarding.ts, which keeps this cookie in sync whenever it disagrees
// with the real localStorage value.
const ONBOARDED_COOKIE = "hanki_v10_onboarded";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/onboarding")) return NextResponse.next();

  const onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "1";
  if (!onboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/dong";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\.\\w+$).*)"],
};
