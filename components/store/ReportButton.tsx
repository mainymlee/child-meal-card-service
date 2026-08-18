"use client";

import { useState } from "react";
import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

const STORAGE_KEY = "hanki:reportedStoreIds";

export function ReportButton({ storeId }: { storeId: string }) {
  const [reported, setReported] = useState(false);

  const handleClick = () => {
    const existing = readLocalStorage<string[]>(STORAGE_KEY) ?? [];
    if (!existing.includes(storeId)) {
      writeLocalStorage(STORAGE_KEY, [...existing, storeId]);
    }
    setReported(true);
  };

  return (
    <button className="report" onClick={handleClick} disabled={reported}>
      {reported ? "신고했어요. 확인해볼게" : "여기서 급식카드가 안 됐어요"}
    </button>
  );
}
