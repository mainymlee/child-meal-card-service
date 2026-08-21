import type { VerificationStatus } from "@/lib/ranking";

type PillVariant = "ok" | "warn" | "neu" | "pri" | "bad";

export function Pill({
  variant,
  dot,
  children,
}: {
  variant: PillVariant;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={`pill ${variant}`}>
      {dot ? <span className="d" /> : null}
      {children}
    </span>
  );
}

export function StoreBadgePills({
  openNow,
  isCvs,
  soloFriendly,
  takeoutAvailable,
  verification,
  compact,
}: {
  openNow: boolean;
  isCvs?: boolean;
  soloFriendly: boolean;
  takeoutAvailable: boolean;
  verification: VerificationStatus;
  compact?: boolean;
}) {
  return (
    <div className="badges">
      {isCvs ? (
        <Pill variant="ok" dot>
          24시간
        </Pill>
      ) : openNow ? (
        <Pill variant="ok" dot>
          지금 영업
        </Pill>
      ) : (
        <Pill variant="neu">영업 종료</Pill>
      )}
      {!compact && soloFriendly ? <Pill variant="pri">혼밥 편함</Pill> : null}
      {!compact && takeoutAvailable ? <Pill variant="neu">포장 가능</Pill> : null}
      {verification === "confirmed" ? (
        <Pill variant="ok">결제 확인됨</Pill>
      ) : verification === "pending" ? (
        <Pill variant="warn">확인 중</Pill>
      ) : (
        <Pill variant="neu">결제 미확인</Pill>
      )}
    </div>
  );
}
