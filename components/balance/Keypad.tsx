export function Keypad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
}) {
  return (
    <div className="pad">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
        <button key={n} onClick={() => onDigit(n)}>
          {n}
        </button>
      ))}
      <button className="fn" onClick={() => onDigit("000")}>
        000
      </button>
      <button onClick={() => onDigit("0")}>0</button>
      <button className="fn" onClick={onBackspace}>
        지우기
      </button>
    </div>
  );
}
