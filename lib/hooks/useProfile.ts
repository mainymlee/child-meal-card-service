import { createPersistentState } from "./createPersistentState";
import { DEFAULT_PROFILE } from "@/lib/persona";
import type { Profile } from "@/lib/types";

const store = createPersistentState<Profile>("hanki:profile", DEFAULT_PROFILE);

export const useProfile = store.useValue;
export const setProfile = store.set;
