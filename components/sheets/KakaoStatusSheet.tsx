const HAS_KEY = Boolean(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY);

// v3 mockup lets a user paste their own Kakao JS key at runtime — dropped here
// since this app's key is baked in at Vercel build time (NEXT_PUBLIC_KAKAO_MAP_KEY);
// a runtime override would just be a second, confusing source of truth. This
// is a read-only status display instead.
export function KakaoStatusSheet() {
  return (
    <>
      <h3>카카오맵 연결 상태</h3>
      <p className="desc">
        {HAS_KEY
          ? "카카오맵 키가 연결되어 있어서 실제 지도로 보여요."
          : "카카오맵 키가 설정되어 있지 않아서 약도 모드로 대신 보여줘요. 실제 지도가 필요하면 배포 환경변수(NEXT_PUBLIC_KAKAO_MAP_KEY)를 설정해야 해요."}
      </p>
      <div className="card flat">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span>연결 상태</span>
          <b style={{ color: HAS_KEY ? "var(--green)" : "var(--g600)" }}>
            {HAS_KEY ? "연결됨" : "약도 모드"}
          </b>
        </div>
      </div>
    </>
  );
}
