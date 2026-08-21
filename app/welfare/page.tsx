"use client";

import { NavBar } from "@/components/layout/NavBar";
import { TabBar } from "@/components/layout/TabBar";
import { WelfareCard } from "@/components/welfare/WelfareCard";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { useProfile } from "@/lib/hooks/useProfile";
import { matchForPersona, profileToTags, WELFARE_POLICIES } from "@/lib/welfare";

export default function WelfarePage() {
  const profile = useProfile();
  const dong = useDong() ?? DEFAULT_DONG;
  const matched = matchForPersona(profileToTags(profile), WELFARE_POLICIES);

  return (
    <>
      <NavBar title="받을 수 있는 혜택" backHref="/me" />

      <div className="screenBody">
        <div className="card flat" style={{ marginTop: 4 }}>
          <p className="lbl" style={{ marginBottom: 7 }}>
            내 조건
          </p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span className="pill neu">{profile.familyType}</span>
            <span className="pill neu">춘천시 {dong}</span>
            <span className="pill neu">{profile.schoolLevel}</span>
          </div>
        </div>

        <p className="lbl" style={{ margin: "16px 0 9px" }}>
          조건에 맞는 제도 <b style={{ color: "var(--blue)" }}>{matched.length}개</b>
        </p>

        {matched.map((policy) => (
          <WelfareCard key={policy.id} policy={policy} />
        ))}

        <div className="card flat">
          <p className="sub" style={{ margin: 0 }}>
            <b style={{ color: "var(--g900)" }}>금액은 참고용이에요.</b> 실제 지원은 담당 기관 심사 결과에 따라 달라져요.
            <br />
            신청은 이 앱에서 하지 않아요. 담당 기관 절차를 그대로 따르면 되고, 여기서는{" "}
            <b style={{ color: "var(--g900)" }}>어디에 무엇이 있는지</b>까지만 알려드릴게요.
          </p>
        </div>
      </div>

      <TabBar />
    </>
  );
}
