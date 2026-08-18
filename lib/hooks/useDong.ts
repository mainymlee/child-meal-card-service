import { createPersistentState } from "./createPersistentState";
import type { Dong } from "@/lib/types";

export const DEFAULT_DONG: Dong = "후평동";

const store = createPersistentState<Dong | null>("hanki:dong", null);

export const useDong = store.useValue;
export const setDong = store.set;
