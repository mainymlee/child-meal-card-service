import { createPersistentState } from "./createPersistentState";

const store = createPersistentState<Record<string, number>>("hanki:reports", {});

export const useReports = store.useValue;

export function reportStore(storeId: string) {
  store.set((prev) => ({ ...prev, [storeId]: (prev[storeId] || 0) + 2 }));
}
