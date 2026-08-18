type PillVariant = "ok" | "warn" | "neu" | "pri";

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
  soloFriendly,
  takeoutAvailable,
  paymentConfirmed,
  openNow,
}: {
  soloFriendly: boolean;
  takeoutAvailable: boolean;
  paymentConfirmed: boolean;
  openNow: boolean;
}) {
  return (
    <div className="badges">
      {openNow ? (
        <Pill variant="ok" dot>
          지금 영업
        </Pill>
      ) : (
        <Pill variant="neu">영업 종료</Pill>
      )}
      {soloFriendly ? <Pill variant="pri">혼밥 편함</Pill> : null}
      {takeoutAvailable ? <Pill variant="neu">포장 가능</Pill> : null}
      {paymentConfirmed ? <Pill variant="ok">결제 확인됨</Pill> : null}
    </div>
  );
}
