import { notFound } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { ImgIcon } from "@/components/icons";
import { StoreBadgePills } from "@/components/Pill";
import { ReportButton } from "@/components/store/ReportButton";
import { PERSONA_HOME } from "@/lib/persona";
import {
  distanceMeters,
  getStoreById,
  isOpenNow,
  walkingMinutes,
} from "@/lib/stores";
import { nowInSeoul } from "@/lib/time";

// 영업 여부가 현재 시각에 의존하므로 매 요청마다 다시 렌더링한다.
export const dynamic = "force-dynamic";

export default async function StoreDetailPage(
  props: PageProps<"/store/[id]">
) {
  const { id } = await props.params;
  // Route params can arrive still percent-encoded for non-ASCII (Korean) ids.
  const store = getStoreById(decodeURIComponent(id));
  if (!store) notFound();

  const now = nowInSeoul();
  const openNow = isOpenNow(store, now);
  const distance = distanceMeters(PERSONA_HOME, store);
  const walk = walkingMinutes(distance);
  const directionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    store.name
  )},${store.lat},${store.lng}`;

  return (
    <>
      <NavBar title={store.name} backHref="/result" action={<span className="act">공유</span>} />

      <div className="screenBody">
        <div className="hero">
          <ImgIcon size={30} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <StoreBadgePills
            openNow={openNow}
            soloFriendly={store.badges.soloFriendly}
            takeoutAvailable={store.badges.takeoutAvailable}
            paymentConfirmed={store.badges.paymentConfirmed}
          />
        </div>

        <p className="nm" style={{ fontSize: 19, letterSpacing: "-.02em", margin: "0 0 3px" }}>
          {store.name}
        </p>
        <p className="mt" style={{ margin: 0 }}>
          {store.category} · 후평동
        </p>

        <dl className="kv">
          <dt>영업시간</dt>
          <dd>
            {store.hours.open} – {store.hours.close}{" "}
            <span style={{ color: openNow ? "var(--good)" : "var(--ink-3)", fontWeight: 650 }}>
              · {openNow ? "영업 중" : "영업 종료"}
            </span>
          </dd>
          <dt>거리</dt>
          <dd>
            {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`} · 도보 {walk}분
          </dd>
          <dt>주문 방식</dt>
          <dd>카운터 주문 · 1인 테이블 있음</dd>
          <dt>확인일</dt>
          <dd>
            {store.badges.paymentConfirmedDate ?? "아직 확인 안 됨"}{" "}
            {store.badges.paymentConfirmed ? (
              <span style={{ color: "var(--ink-3)" }}>(결제 확인)</span>
            ) : null}
          </dd>
        </dl>

        <div className="card" style={{ marginTop: 16 }}>
          <p className="lbl">1만 원 안에 되는 메뉴</p>
          <ul className="menu">
            {store.menu.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className={`p ${item.underBudget ? "ok" : ""}`} style={item.underBudget ? undefined : { color: "var(--ink-3)" }}>
                  {item.price.toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card flat">
          <p className="sub" style={{ margin: 0 }}>
            {store.badges.soloFriendly
              ? "혼자 가도 편한 곳이야 — 카운터에서 바로 주문하면 돼."
              : "매장 식사 위주라 같이 가면 더 편해."}
          </p>
        </div>
      </div>

      <div className="footerAction">
        <a className="btn" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          길찾기 · 도보 {walk}분
        </a>
        <ReportButton storeId={store.id} />
      </div>
    </>
  );
}
