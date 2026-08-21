import storesFile from "@/data/stores.json";
import type { Dong, Store, StoresFile } from "./types";

const DATA = storesFile as StoresFile;

export const STORES: Store[] = DATA.stores;
export const STORES_ARE_PLACEHOLDER = DATA.placeholderCoordinates;

export function getStoreById(id: string): Store | undefined {
  return STORES.find((s) => s.id === id);
}

export function storesInDong(dong: Dong): Store[] {
  return STORES.filter((s) => s.neighborhood === dong);
}

export const GPS_STORE_RADIUS_METERS = 5_000;

export function storesNear(
  location: { lat: number; lng: number },
  radiusMeters = GPS_STORE_RADIUS_METERS
): Store[] {
  return STORES.filter((store) => distanceMeters(location, store) <= radiusMeters);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * hourOverride (0-24, fractional) replaces only "what hour is it" for the
 * open/closed time-of-day check — it's driven by the judging/demo FAB and
 * must never affect closedDays, which stays keyed to the real weekday.
 */
export function isOpenNow(
  store: Store,
  now: Date,
  hourOverride?: number | null
): boolean {
  if (store.closedDays.includes(now.getDay())) return false;
  const nowMin =
    hourOverride != null
      ? Math.round(hourOverride * 60)
      : now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(store.hours.open);
  const close = toMinutes(store.hours.close);
  if (close >= open) {
    return nowMin >= open && nowMin < close;
  }
  // overnight window (close time is past midnight)
  return nowMin >= open || nowMin < close;
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function cheapestUnderBudgetItem(store: Store) {
  const underBudget = store.menu.filter((m) => m.underBudget);
  const pool = underBudget.length ? underBudget : store.menu;
  return [...pool].sort((a, b) => a.price - b.price)[0];
}

export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80)); // ~80m/min walking pace
}
