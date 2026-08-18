import { StoreBadgePills } from "@/components/Pill";
import { cheapestUnderBudgetItem, walkingMinutes } from "@/lib/stores";
import type { Store } from "@/lib/types";

const CATEGORY_EMOJI = {
  kr: "🍚",
  cn: "🥡",
  wf: "🍴",
  bs: "🍢",
  cvs: "🏪",
} as const;

export function StoreRow({
  store,
  distance,
  openNow,
  verification,
  onClick,
}: {
  store: Store;
  distance: number;
  openNow: boolean;
  verification: "ok" | "pending";
  onClick: () => void;
}) {
  const item = cheapestUnderBudgetItem(store);
  const isCvs = store.cat2 === "cvs";
  const pending = verification === "pending";

  return (
    <button
      className={`store fade cat-${store.cat2} ${isCvs ? "cvsrow " : ""}${pending ? "demoted" : ""}`}
      onClick={onClick}
    >
      <span className="no tossface" aria-hidden="true">
        {CATEGORY_EMOJI[store.cat2]}
      </span>
      <div>
        <p className="nm">{store.name}</p>
        <p className="mt">
          {store.category} · {item
            ? `${item.name} ${item.price.toLocaleString()}원 예상`
            : "메뉴 확인 필요"}
        </p>
        <StoreBadgePills
          openNow={openNow}
          isCvs={isCvs}
          soloFriendly={store.badges.soloFriendly}
          takeoutAvailable={store.badges.takeoutAvailable}
          verification={verification}
          compact
        />
      </div>
      <span className="dist">
        <b>
          {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
        </b>
        도보 {walkingMinutes(distance)}분
      </span>
    </button>
  );
}
