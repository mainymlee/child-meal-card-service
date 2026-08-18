"use client";

import { useEffect } from "react";
import { setOnboarded, useOnboarded } from "@/lib/hooks/useOnboarded";

const ONBOARDED_COOKIE = "hanki_v10_onboarded";
const ONE_YEAR = 60 * 60 * 24 * 365;

function setCookie() {
  document.cookie = `${ONBOARDED_COOKIE}=1; path=/; max-age=${ONE_YEAR}`;
}

// Called from the onboarding "done" screen once the user finishes.
export function markOnboarded() {
  setOnboarded(true);
  setCookie();
}

// localStorage is authoritative; if it says "onboarded" but the cookie was
// cleared independently (e.g. user cleared cookies only), re-sync the cookie
// so middleware doesn't bounce a returning, already-onboarded user back into
// onboarding. Mount this once near the app root.
export function useSyncOnboardedCookie() {
  const onboarded = useOnboarded();
  useEffect(() => {
    if (!onboarded) return;
    if (!document.cookie.includes(`${ONBOARDED_COOKIE}=1`)) setCookie();
  }, [onboarded]);
}
