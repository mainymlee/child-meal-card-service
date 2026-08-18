"use client";

import { useSyncExternalStore } from "react";

// Generic localStorage-backed store, one instance per persisted field.
// Mirrors the useSyncExternalStore pattern in useBalance.tsx: getServerSnapshot
// always returns the fixed default (so SSR and the client's first hydration
// pass agree), getSnapshot/subscribe only ever run in the browser, and writes
// notify subscribers manually since same-tab localStorage writes don't fire
// the native "storage" event.
export function createPersistentState<T>(key: string, defaultValue: T) {
  let cachedRaw: string | null = null;
  let cachedSnapshot: T = defaultValue;
  const listeners = new Set<() => void>();

  function getSnapshot(): T {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = null;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedSnapshot = raw ? (JSON.parse(raw) as T) : defaultValue;
      } catch {
        cachedSnapshot = defaultValue;
      }
    }
    return cachedSnapshot;
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function set(next: T | ((prev: T) => T)) {
    const resolved =
      typeof next === "function"
        ? (next as (prev: T) => T)(getSnapshot())
        : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(resolved));
    } catch {
      // ignore quota / privacy-mode errors
    }
    cachedRaw = JSON.stringify(resolved);
    cachedSnapshot = resolved;
    listeners.forEach((l) => l());
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  return { useValue, set, getSnapshot };
}
