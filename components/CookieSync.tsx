"use client";

import { useSyncOnboardedCookie } from "@/lib/onboarding";

export function CookieSync() {
  useSyncOnboardedCookie();
  return null;
}
