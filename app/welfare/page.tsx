import { NavBar } from "@/components/layout/NavBar";
import { TabBar } from "@/components/layout/TabBar";
import { WelfareCard } from "@/components/welfare/WelfareCard";
import { PERSONA } from "@/lib/persona";
import { matchForPersona, WELFARE_POLICIES } from "@/lib/welfare";

export default function WelfarePage() {
  const tags = [PERSONA.familyType, "아동", PERSONA.schoolLevel];
  const matched = matchForPersona(tags, WELFARE_POLICIES);

  return (
    <>
      <NavBar title="받을 수 있는 혜택" backHref="/" />

      <div className="screenBody">
        <div className="card flat" style={{ marginTop: 4 }}>
          <p className="lbl" style={{ marginBottom: 7 }}>내 조건</p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span className="pill neu">{PERSONA.familyType}</span>
            <span className="pill neu">{PERSONA.age}세</span>
            <span className="pill neu">{PERSONA.region.replace("후평동", "")}</span>
            <span className="pill neu">{PERSONA.schoolLevel}</span>
          </div>
        </div>

        <p className="lbl" style={{ margin: "16px 0 9px" }}>
          조건에 맞는 제도 <b style={{ color: "var(--primary)" }}>{matched.length}개</b>
        </p>

        {matched.map((policy) => (
          <WelfareCard key={policy.id} policy={policy} />
        ))}

        <div className="card flat">
          <p className="sub" style={{ margin: 0 }}>
            신청은 이 앱에서 하지 않아. 담당 기관 절차를 그대로 따르면 되고, 여기서는{" "}
            <b style={{ color: "var(--ink)" }}>어디에 무엇이 있는지</b>까지만 알려줄게.
          </p>
        </div>
      </div>

      <TabBar />
    </>
  );
}
