"use client";

import { setOnboarded } from "@/lib/hooks/useOnboarded";

const VISIT_STARTED_COOKIE = "hanki_visit_started";

function startVisit() {
  // No max-age/expires: the browser removes this when the session ends.
  document.cookie = `${VISIT_STARTED_COOKIE}=1; path=/; SameSite=Lax`;
}

// Called from the onboarding "done" screen once the user finishes this visit.
export function markOnboarded() {
  setOnboarded(true);
  startVisit();
}
