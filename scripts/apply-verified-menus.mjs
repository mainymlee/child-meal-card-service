import { readFileSync, writeFileSync } from "node:fs";

const storesPath = "data/stores.json";
const verifiedPath = "data/verified-menus.json";
const storesFile = JSON.parse(readFileSync(storesPath, "utf8"));
const verifiedFile = JSON.parse(readFileSync(verifiedPath, "utf8"));
const storesById = new Map(storesFile.stores.map((store) => [store.id, store]));
const seen = new Set();

if (!verifiedFile.entries.length) {
  console.log("No verified menu entries to apply.");
  process.exit(0);
}

for (const entry of verifiedFile.entries) {
  if (seen.has(entry.storeId)) throw new Error(`Duplicate storeId: ${entry.storeId}`);
  seen.add(entry.storeId);
  const store = storesById.get(entry.storeId);
  if (!store) throw new Error(`Unknown storeId: ${entry.storeId}`);
  if (!entry.verifiedAt || Number.isNaN(Date.parse(entry.verifiedAt))) {
    throw new Error(`Invalid verifiedAt: ${entry.storeId}`);
  }
  if (!Array.isArray(entry.menu) || !entry.menu.length) {
    throw new Error(`Menu is empty: ${entry.storeId}`);
  }
  for (const menu of entry.menu) {
    if (!menu.name?.trim() || !Number.isInteger(menu.price) || menu.price <= 0) {
      throw new Error(`Invalid menu item: ${entry.storeId}`);
    }
  }
  if (!["store-confirmed", "brand-official"].includes(entry.sourceType)) {
    throw new Error(`Invalid sourceType: ${entry.storeId}`);
  }

  store.menu = entry.menu.map((menu) => ({
    name: menu.name.trim(),
    price: menu.price,
    underBudget: menu.price <= 10000,
  }));
  store.menuSource = entry.sourceType === "store-confirmed"
    ? "store-verified"
    : "brand-official";
  store.menuVerification = {
    sourceType: entry.sourceType,
    sourceUrl: entry.sourceUrl || null,
    verifiedAt: entry.verifiedAt,
    note: entry.note || null,
  };
}

storesFile.menuVerifiedAt = new Date().toISOString();
storesFile.menuSourceCounts = storesFile.stores.reduce((counts, store) => {
  counts[store.menuSource] = (counts[store.menuSource] || 0) + 1;
  return counts;
}, {});
writeFileSync(storesPath, `${JSON.stringify(storesFile, null, 2)}\n`, "utf8");
console.log(`Applied ${verifiedFile.entries.length} verified menu entries.`);
