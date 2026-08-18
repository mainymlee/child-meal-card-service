import { createPersistentState } from "./createPersistentState";
import type { NotifPrefs } from "@/lib/types";

const store = createPersistentState<NotifPrefs>("hanki:notif", {
  monthly: true,
  dday: true,
});

export const useNotifPrefs = store.useValue;
export const setNotifPrefs = store.set;
