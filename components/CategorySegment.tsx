import { CAT2_LABELS } from "@/lib/taxonomy";
import type { SimplifiedCategory } from "@/lib/types";

export type CategoryFilter = "all" | SimplifiedCategory;

const ORDER: SimplifiedCategory[] = ["kr", "cn", "wf", "bs", "cvs"];

export function CategorySegment({
  active,
  counts,
  onChange,
}: {
  active: CategoryFilter;
  counts: Record<CategoryFilter, number>;
  onChange: (next: CategoryFilter) => void;
}) {
  return (
    <div className="seg" role="tablist" aria-label="음식 카테고리">
      <button
        role="tab"
        aria-selected={active === "all"}
        className={active === "all" ? "on" : ""}
        onClick={() => onChange("all")}
      >
        전체 <span className="cnt">{counts.all}</span>
      </button>
      {ORDER.map((cat2) => (
        <button
          key={cat2}
          role="tab"
          aria-selected={active === cat2}
          className={active === cat2 ? "on" : ""}
          onClick={() => onChange(cat2)}
        >
          {CAT2_LABELS[cat2]} <span className="cnt">{counts[cat2]}</span>
        </button>
      ))}
    </div>
  );
}
