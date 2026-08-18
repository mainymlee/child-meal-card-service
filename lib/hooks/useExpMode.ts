import { createPersistentState } from "./createPersistentState";
import type { ExpMode } from "@/lib/types";

const store = createPersistentState<ExpMode>("hanki:expMode", "month");

export const useExpMode = store.useValue;
export const setExpMode = store.set;
