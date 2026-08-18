"use client";

import { DownIcon } from "@/components/icons";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { DongSheet } from "@/components/sheets/DongSheet";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";

export function DongButton() {
  const dong = useDong();
  const { open } = useSheet();

  return (
    <button
      className="dongbtn"
      aria-label="동네 바꾸기"
      onClick={() => open(<DongSheet />)}
    >
      {dong ?? DEFAULT_DONG}
      <DownIcon size={14} strokeWidth={2.2} />
    </button>
  );
}
