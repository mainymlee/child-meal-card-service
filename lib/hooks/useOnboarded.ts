import { createPersistentState } from "./createPersistentState";

const store = createPersistentState<boolean>("hanki:onboarded", false);

export const useOnboarded = store.useValue;
export const setOnboarded = store.set;
