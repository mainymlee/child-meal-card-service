"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { DongButton } from "@/components/layout/DongButton";
import { TabBar } from "@/components/layout/TabBar";
import { StoreRow } from "@/components/StoreRow";
import { CVS_COMBOS, comboTotal, fitsUnderBudget } from "@/lib/cvsCombos";
import { dongCenter } from "@/lib/persona";
import { DEFAULT_DONG, useDong } from "@/lib/hooks/useDong";
import { useDemoHour } from "@/lib/hooks/useDemoHour";
import { useReports } from "@/lib/hooks/useReports";
import { distanceMeters, isOpenNow, storesInDong } from "@/lib/stores";
import { verificationStatus } from "@/lib/ranking";
import { nowInSeoul } from "@/lib/time";

export default function CvsPage() {
  const router = useRouter();
  const dong = useDong() ?? DEFAULT_DONG;
  const { hourOverride } = useDemoHour();
  const reports = useReports();
  const now = useMemo(() => nowInSeoul(), []);
  const home = dongCenter(dong);

  const openCvs = storesInDong(dong)
    .filter((s) => s.cat2 === "cvs" && isOpenNow(s, now, hourOverride))
    .sort((a, b) => distanceMeters(home, a) - distanceMeters(home, b));

  return (
    <>
      <NavBar title="편의점에서 균형 있게" backHref="/result" extra={<DongButton />} />

      <div className="screenBody">
        <div className="card flat" style={{ marginTop: 2 }}>
          <p className="sub" style={{ margin: 0 }}>
            편의점도 괜찮아요 — 다만 <b>밥 · 단백질 · 우유나 과일</b>이 같이 있으면 좋아요.
            아래 조합은 전부 카드로 살 수 있는 품목이에요.
          </p>
        </div>

        <div className="listhead" style={{ marginTop: 14 }}>
          <p>
            추천 조합 <b>{CVS_COMBOS.length}개</b>
          </p>
          <span>{openCvs[0]?.name ?? dong}</span>
        </div>
        {CVS_COMBOS.map((combo) => {
          const total = comboTotal(combo);
          const fits = fitsUnderBudget(combo);
          return (
            <div className="combo" key={combo.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <p className="lbl" style={{ margin: 0 }}>
                  {combo.title}
                </p>
                <span
                  className={`pill ${fits ? "ok" : "warn"}`}
                  style={{ marginLeft: "auto" }}
                >
                  {fits ? "1식 한도 안" : "한도 초과"}
                </span>
              </div>
              <div className="items">
                {combo.items.map((item) => (
                  <div className="it" key={item.name}>
                    <b>{item.name}</b>
                    <span>{item.price.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
              <div className="tot">
                <span>합계</span>
                <span className="p" style={fits ? undefined : { color: "var(--red)" }}>
                  {total.toLocaleString()}원
                </span>
              </div>
              {combo.note ? (
                <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
                  {combo.note}
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="listhead" style={{ marginTop: 18 }}>
          <p>
            가까운 편의점 <b>{openCvs.length}곳</b>
          </p>
          <span>
            {dong} · {String(now.getHours()).padStart(2, "0")}:
            {String(now.getMinutes()).padStart(2, "0")}
          </span>
        </div>
        {openCvs.length ? (
          openCvs.map((store, i) => (
            <StoreRow
              key={store.id}
              store={store}
              index={i}
              distance={distanceMeters(home, store)}
              openNow
              verification={verificationStatus(reports, store.id)}
              onClick={() => router.push(`/store/${store.id}`)}
            />
          ))
        ) : (
          <div className="empty">
            <div className="big">🏪</div>
            <h3>등록된 편의점이 없어요</h3>
            <p>다른 동네로 바꿔서 확인해보세요.</p>
          </div>
        )}

        <div className="card flat">
          <p className="sub" style={{ margin: 0 }}>
            술 · 담배 · 커피는 카드로 결제되지 않아요. 안 되는 품목이 있었다면{" "}
            <b>여기서 알려주세요</b> — 다른 친구들에게도 도움이 돼요.
          </p>
        </div>
      </div>

      <TabBar />
    </>
  );
}
