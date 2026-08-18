# 한끼 — 결식아동 급식카드 지원 서비스

기획서(`docs/결식아동_급식카드_기획서_개정1_20260814본.md`)와 UI 프로토타입(`docs/UI_프로토타입.html`)을 바탕으로 만든 Next.js 앱. 로그인 없이 단일 데모 페르소나(김지민)로 동작하며, 잔액은 브라우저 localStorage에 저장된다.

**배포:** https://child-meal-card-service.vercel.app

## 폴더 구조

```
app/ components/ lib/ data/ scripts/ types/   # Next.js 앱 (루트에 있어야 함)
docs/                                          # 기획서, 워크시트, UI 프로토타입 — 참고용, 앱 코드 아님
data/raw/                                      # 원본 CSV (지오코딩 스크립트 입력)
```

## 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인. `.env.local`에 카카오맵 키가 없으면 지도 자리에 안내 문구가 대신 표시되고 나머지 기능은 정상 동작한다.

## 카카오맵 키 설정 (지도를 실제로 보려면 필요)

1. [카카오 개발자](https://developers.kakao.com)에서 애플리케이션을 만들고 **제품 설정 > 카카오맵**을 켠다.
2. **앱 설정 > 플랫폼 키 > JavaScript 키**를 복사해 `.env.local`의 `NEXT_PUBLIC_KAKAO_MAP_KEY`에 넣는다 (`.env.example` 참고).
3. 같은 화면의 **JavaScript SDK 도메인**에 `http://localhost:3000`을 등록한다. 등록하지 않으면 지도가 브라우저 콘솔 에러만 내고 조용히 안 뜬다.
4. Vercel에 배포할 때는 배포 도메인(`*.vercel.app` 등)도 같은 목록에 추가로 등록하고, `NEXT_PUBLIC_KAKAO_MAP_KEY`를 Vercel 프로젝트의 Production/Preview 환경변수에도 등록한다.
5. `NEXT_PUBLIC_*` 환경변수는 **빌드 시점**에 코드에 박히므로, Vercel에서 값을 새로 넣거나 바꾼 뒤에는 반드시 **Redeploy**해야 반영된다 — 그냥 두면 예전 값(또는 빈 값)으로 빌드된 상태가 계속 서빙된다.

## 가맹점 데이터 재생성 (선택)

`data/stores.json`은 이미 카카오 REST API로 지오코딩한 실제 좌표로 커밋되어 있다 (306개 중 302개 성공, 4개는 CSV 주소 오탈자로 실패 — `scripts/geocode-failures.json` 참고). 원본 CSV가 갱신되거나 다시 만들고 싶으면:

1. **앱 설정 > 플랫폼 키 > REST API 키**를 `.env.local`의 `KAKAO_REST_API_KEY`에 넣는다.
2. 실행:
   ```bash
   npm run geocode
   ```
3. `data/stores.json`이 `data/raw/춘천시_아동급식카드_가맹점_20250714.csv`를 기준으로 다시 생성된다.

이 스크립트는 로컬에서 실행하는 용도로, Vercel 빌드 시에는 실행되지 않는다 (카카오 API 쿼터를 배포마다 소모하지 않기 위함).

## Vercel 배포

1. 저장소를 Vercel에 연결한다 (Next.js App Router는 별도 설정 없이 자동 인식됨).
2. Vercel 프로젝트 설정 > Environment Variables에 `NEXT_PUBLIC_KAKAO_MAP_KEY`를 등록한다.
3. 카카오 개발자 콘솔의 JavaScript SDK 도메인 목록에 배포 도메인을 추가한다.
4. 환경변수를 나중에 추가/수정했다면 **Redeploy**를 한 번 더 실행한다.
5. 배포 후 지도가 뜨는지, 브라우저 콘솔에 에러가 없는지 확인한다.

## 하지 않는 것

로그인/멀티유저, DB, 카드사 실시간 잔액 연동, 복지 신청 대행, 보호자 모니터링, 실시간 영업정보 동기화, 실제 길찾기 API — `docs/결식아동_급식카드_기획서_개정1_20260814본.md` 5장(Non-goals) 참고.
