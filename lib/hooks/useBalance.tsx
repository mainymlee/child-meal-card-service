"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_STARTING_BALANCE } from "@/lib/persona";
import { writeLocalStorage } from "@/lib/storage";

const STORAGE_KEY = "hanki:balance";

interface StoredBalance {
  balance: number;
  lastUpdatedISO: string;
}

const DEFAULT_BALANCE: StoredBalance = {
  balance: DEFAULT_STARTING_BALANCE,
  lastUpdatedISO: "",
};

// A tiny external store backed by localStorage, read via useSyncExternalStore
// so the server render and the client's first hydration pass agree (both use
// getServerSnapshot), and the real stored value only takes over once
// hydration is safely past. getSnapshot/subscribe below only ever run in the
// browser, so the module-level cache is scoped to one browser tab, not
// shared across server requests.
let cachedRaw: string | null = null;
let cachedSnapshot: StoredBalance = DEFAULT_BALANCE;
const listeners = new Set<() => void>();

function getSnapshot(): StoredBalance {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSnapshot = raw ? (JSON.parse(raw) as StoredBalance) : DEFAULT_BALANCE;
    } catch {
      cachedSnapshot = DEFAULT_BALANCE;
    }
  }
  return cachedSnapshot;
}

function getServerSnapshot(): StoredBalance {
  return DEFAULT_BALANCE;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

interface BalanceContextValue {
  balance: number;
  lastUpdatedISO: string;
  setBalance: (next: number) => void;
}

const BalanceContext = createContext<BalanceContextValue | null>(null);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setBalance = (next: number) => {
    const value: StoredBalance = { balance: next, lastUpdatedISO: new Date().toISOString() };
    writeLocalStorage(STORAGE_KEY, value);
    cachedRaw = JSON.stringify(value);
    cachedSnapshot = value;
    listeners.forEach((l) => l());
  };

  const value = useMemo(
    () => ({ balance: stored.balance, lastUpdatedISO: stored.lastUpdatedISO, setBalance }),
    [stored]
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

export function useBalance(): BalanceContextValue {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used within a BalanceProvider");
  return ctx;
}
