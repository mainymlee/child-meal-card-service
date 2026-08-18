"use client";

import { useRouter } from "next/navigation";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { ReportSheet } from "@/components/sheets/ReportSheet";
import type { Dong } from "@/lib/types";

export function ReportButton({ storeId, dong }: { storeId: string; dong: Dong }) {
  const router = useRouter();
  const { open } = useSheet();

  return (
    <button
      className="report"
      onClick={() =>
        open(
          <ReportSheet
            storeId={storeId}
            dong={dong}
            onNavigate={(id) => router.push(`/store/${id}`)}
          />
        )
      }
    >
      여기서 급식카드가 안 됐어요
    </button>
  );
}
