import type { WelfarePolicy } from "@/lib/types";

export function WelfareCard({ policy }: { policy: WelfarePolicy }) {
  const pillVariant = policy.status === "이용중" ? "ok" : "pri";
  return (
    <div className="wcard">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <h6>{policy.title}</h6>
        <span className={`pill ${pillVariant}`} style={{ flex: "none" }}>
          {policy.status}
        </span>
      </div>
      <p>{policy.description}</p>
      <div className="row">
        <span className="amt">{policy.amount}</span>
        <a href={policy.link} target="_blank" rel="noopener noreferrer">
          {policy.org} ↗
        </a>
      </div>
    </div>
  );
}
