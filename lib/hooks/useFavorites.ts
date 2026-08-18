import { createPersistentState } from "./createPersistentState";

const store = createPersistentState<string[]>("hanki:favorites", []);

export const useFavorites = store.useValue;

export function toggleFavorite(storeId: string) {
  store.set((prev) =>
    prev.includes(storeId)
      ? prev.filter((id) => id !== storeId)
      : [...prev, storeId]
  );
}
