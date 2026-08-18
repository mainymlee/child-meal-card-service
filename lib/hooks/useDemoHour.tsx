"use client";

import { createContext, useContext, useMemo, useState } from "react";

// In-memory only (not persisted) — this overrides only "what hour is it right
// now" for open/closed checks, used solely by the judging/demo FAB. It must
// reset on reload, unlike every other piece of app state, since it's a lie
// about the current time and should never silently survive a session.
interface DemoHourContextValue {
  hourOverride: number | null;
  setHourOverride: (hour: number | null) => void;
}

const DemoHourContext = createContext<DemoHourContextValue | null>(null);

export function DemoHourProvider({ children }: { children: React.ReactNode }) {
  const [hourOverride, setHourOverride] = useState<number | null>(null);
  const value = useMemo(() => ({ hourOverride, setHourOverride }), [hourOverride]);
  return <DemoHourContext.Provider value={value}>{children}</DemoHourContext.Provider>;
}

export function useDemoHour(): DemoHourContextValue {
  const ctx = useContext(DemoHourContext);
  if (!ctx) throw new Error("useDemoHour must be used within a DemoHourProvider");
  return ctx;
}
