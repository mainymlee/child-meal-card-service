# 한끼 — 결식아동 급식카드 지원 서비스

기획서(`결식아동_급식카드_기획서_개정1_20260814본.md`)와 UI 프로토타입(`UI_프로토타입.html`)을 바탕으로 만든 Next.js 앱. 로그인 없이 단일 데모 페르소나(김지민)로 동작하며, 잔액은 브라우저 localStorage에 저장된다.

## 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인. 카카오맵 키가 없으면 지도 자리에 안내 문구가 대신 표시되고 나머지 기능은 정상 동작한다.

## 카카오맵 키 설정 (지도를 실제로 보려면 필요)

1. [카카오 개발자](https://developers.kakao.com)에서 애플리케이션을 만든다.
2. **앱 키 > JavaScript 키**를 복사해 `.env.local`의 `NEXT_PUBLIC_KAKAO_MAP_KEY`에 넣는다 (`.env.example` 참고).
3. **제품 설정 > 플랫폼 > Web**에 `http://localhost:3000` 을 등록한다. 등록하지 않으면 지도가 브라우저 콘솔 에러만 내고 조용히 안 뜬다.
4. Vercel에 배포할 때는 같은 자리에 배포 도메인(`*.vercel.app` 등)도 함께 등록하고, `NEXT_PUBLIC_KAKAO_MAP_KEY`를 Vercel 프로젝트의 Production/Preview 환경변수에도 등록한다.

## 가맹점 데이터 재생성 (선택)

`data/stores.json`은 이미 생성되어 커밋되어 있다 (카카오 REST 키가 없어 후평동 중심 좌표 근처의 placeholder 좌표로 생성됨). 실제 주소 기반 좌표로 다시 만들려면:

1. **앱 키 > REST API 키**를 `.env.local`의 `KAKAO_REST_API_KEY`에 넣는다.
2. 실행:
   ```bash
   npm run geocode
   ```
3. `data/stores.json`이 갱신된다. 지오코딩 실패 건은 `scripts/geocode-failures.json`에 기록된다 (있다면 확인).

이 스크립트는 로컬에서 1회만 실행하는 용도로, Vercel 빌드 시에는 실행되지 않는다.

## Vercel 배포

1. 저장소를 Vercel에 연결한다 (Next.js App Router는 별도 설정 없이 자동 인식됨).
2. Vercel 프로젝트 설정 > Environment Variables에 `NEXT_PUBLIC_KAKAO_MAP_KEY`를 등록한다.
3. 카카오 개발자 콘솔의 플랫폼 Web 목록에 배포 도메인을 추가한다.
4. 배포 후 지도가 뜨는지 브라우저 콘솔까지 확인한다.

## 하지 않는 것

로그인/멀티유저, DB, 카드사 실시간 잔액 연동, 복지 신청 대행, 보호자 모니터링, 실시간 영업정보 동기화, 실제 길찾기 API — 기획서 5장(Non-goals) 참고.
