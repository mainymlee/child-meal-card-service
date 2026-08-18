import { STORES } from "./stores";

export const PERSONA = {
  name: "지민",
  fullName: "김지민",
  age: 11,
  region: "춘천시 후평동",
  familyType: "한부모가정",
  schoolLevel: "초등학생",
  cardUsableUntil: "23:00",
  startingBalance: 68000,
};

function centroid(points: { lat: number; lng: number }[]) {
  if (!points.length) return { lat: 37.8814, lng: 127.7269 };
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

export const PERSONA_HOME = centroid(STORES);
