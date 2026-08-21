"use client";

import { createContext, useContext, useMemo, useState } from "react";

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

interface LocationContextValue {
  gpsLocation: GpsLocation | null;
  setGpsLocation: (location: GpsLocation) => void;
  clearGpsLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [gpsLocation, setGpsLocationState] = useState<GpsLocation | null>(null);
  const value = useMemo(() => ({
    gpsLocation,
    setGpsLocation: setGpsLocationState,
    clearGpsLocation: () => setGpsLocationState(null),
  }), [gpsLocation]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useAppLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useAppLocation must be used within LocationProvider");
  return context;
}
