"use client";

import { HeartIcon } from "@/components/icons";
import { useFavorites, toggleFavorite } from "@/lib/hooks/useFavorites";
import { useToast } from "@/lib/overlay/OverlayProvider";

export function FavoriteButton({ storeId }: { storeId: string }) {
  const favorites = useFavorites();
  const { show } = useToast();
  const on = favorites.includes(storeId);

  return (
    <button
      className="iconbtn"
      aria-label="단골 등록"
      aria-pressed={on}
      style={{ color: on ? "var(--red)" : "var(--g400)" }}
      onClick={() => {
        toggleFavorite(storeId);
        show(on ? "단골에서 뺐어요" : "단골로 저장했어요. 홈에서 바로 보여요");
      }}
    >
      <HeartIcon filled={on} />
    </button>
  );
}
