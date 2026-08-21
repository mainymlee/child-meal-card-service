"use client";

import { useRouter } from "next/navigation";
import { useSheet } from "@/lib/overlay/OverlayProvider";
import { ReportSheet } from "@/components/sheets/ReportSheet";
export function ReportButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { open } = useSheet();

  return (
    <button
      className="report"
      onClick={() =>
        open(
          <ReportSheet
            storeId={storeId}
            onNavigate={(id) => router.push(`/store/${id}`)}
          />
        )
      }
    >
      여기서 급식카드가 안 됐어요
    </button>
  );
}
