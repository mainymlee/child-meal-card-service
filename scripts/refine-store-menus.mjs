import { readFileSync, writeFileSync } from "node:fs";
import { deriveMenuProfile } from "./menu-rules.mjs";

const path = "data/stores.json";
const data = JSON.parse(readFileSync(path, "utf8"));
const counts = { "name-derived": 0, "category-derived": 0, unverified: 0 };

data.stores = data.stores.map((store) => {
  const profile = deriveMenuProfile(store.name, store.category);
  counts[profile.menuSource] += 1;
  return {
    ...store,
    grp: profile.grp ?? store.grp,
    menu: profile.menu,
    menuSource: profile.menuSource,
  };
});
data.menuRefinedAt = new Date().toISOString();
data.menuSourceCounts = counts;
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(counts);
