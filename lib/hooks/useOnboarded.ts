import { createPersistentState } from "./createPersistentState";

// Version the onboarding flag whenever the first-run flow changes materially.
// This makes existing users see the restored v10 onboarding once.
const store = createPersistentState<boolean>("hanki:v10:onboarded", false);

export const useOnboarded = store.useValue;
export const setOnboarded = store.set;
