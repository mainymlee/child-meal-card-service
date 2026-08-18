import { STORES } from "./stores";
import type { Dong, FamilyType, Profile, SchoolLevel } from "./types";

export const DEMO_USER_NAME = "지민";
export const CARD_USABLE_UNTIL = "23:00";
export const DEFAULT_STARTING_BALANCE = 68000;

export const DEFAULT_FAMILY_TYPE: FamilyType = "한부모가정";
export const DEFAULT_SCHOOL_LEVEL: SchoolLevel = "초등학생";
export const DEFAULT_PROFILE: Profile = {
  familyType: DEFAULT_FAMILY_TYPE,
  schoolLevel: DEFAULT_SCHOOL_LEVEL,
};

export const FAMILY_TYPES: FamilyType[] = [
  "한부모가정",
  "조손가정",
  "다문화가정",
  "기초생활수급",
];
export const SCHOOL_LEVELS: SchoolLevel[] = ["초등학생", "중학생", "고등학생"];

function centroid(points: { lat: number; lng: number }[]) {
  if (!points.length) return { lat: 37.8814, lng: 127.7269 };
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

const dongCenters = new Map<Dong, { lat: number; lng: number }>();

export function dongCenter(dong: Dong): { lat: number; lng: number } {
  let center = dongCenters.get(dong);
  if (!center) {
    center = centroid(STORES.filter((s) => s.neighborhood === dong));
    dongCenters.set(dong, center);
  }
  return center;
}
