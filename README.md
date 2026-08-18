# 한끼

춘천시 아동급식카드 사용자가 지금 이용할 수 있는 가맹점을 찾고, 균형 있는 메뉴와 잔액 사용 계획, 관련 복지 정보를 확인하는 모바일 웹앱입니다.

배포 주소: <https://child-meal-card-service.vercel.app>

## 주요 기능

- 동네·잔액 설정 온보딩
- 카카오맵 기반 급식카드 가맹점 탐색
- 영업 여부·혼밥·포장·예산·거리 필터
- 편의점 균형 식사 조합
- 가맹점 상세·즐겨찾기·결제 불가 제보
- 최근 식사·영양·만족도를 학습하는 자체 메뉴추천 AI
- 잔액 소진 계획과 복지 정보

## 기술 구성

- Next.js 16 App Router
- React 19, TypeScript
- 카카오맵 JavaScript SDK
- 브라우저 `localStorage` 기반 사용자 설정
- Vercel 배포

## 폴더 구조

```text
app/                 Next.js 페이지와 동적 디자인 자산
components/          공통 UI, 지도, 시트, 가맹점 컴포넌트
lib/                 상태 관리와 추천·잔액·복지 로직
data/                가맹점·복지 JSON 및 원본 CSV
docs/                기획서, 제안서, 워크시트, UI 원본
docs/prototypes/     수정하지 않는 v10 디자인 기준 HTML
scripts/             가맹점 지오코딩 스크립트
types/               카카오맵 타입 선언
```

디자인 기준 파일은 `docs/prototypes/한끼_웹앱_v10.html`입니다. 원본을 수정하지 않고 CSS와 로고를 Next.js 응답에서 읽어 사용합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 엽니다.

## 환경변수

`.env.example`을 참고해 `.env.local`을 만듭니다.

```dotenv
NEXT_PUBLIC_KAKAO_MAP_KEY=
KAKAO_REST_API_KEY=
```

- `NEXT_PUBLIC_KAKAO_MAP_KEY`: 브라우저 지도 표시에 사용합니다. Vercel Production·Preview 환경에도 등록해야 합니다.
- `KAKAO_REST_API_KEY`: `npm run geocode` 실행 시에만 사용하는 로컬 전용 키입니다. Vercel에는 등록하지 않습니다.

카카오 개발자 콘솔의 JavaScript SDK 허용 도메인에는 다음 주소를 등록합니다.

- `http://localhost:3000`
- `https://child-meal-card-service.vercel.app`
- 사용하는 Preview 또는 사용자 지정 도메인

`NEXT_PUBLIC_*` 값은 빌드 시 번들에 포함되므로 변경 후 Vercel에서 재배포해야 합니다.

## 가맹점 데이터

- `data/stores.json`: 앱에서 사용하는 좌표 포함 가맹점 데이터
- `data/raw/춘천시_아동급식카드_가맹점_20250714.csv`: 데이터 생성 기준 원본
- 현재 앱 데이터: 1,372개 가맹점, 모두 유효 좌표 보유

원본 CSV를 갱신한 뒤 좌표를 다시 생성하려면 다음 명령을 실행합니다.

```bash
npm run geocode
```

## 검증

```bash
npm run lint
npm run build
```

## MVP 제외 범위

회원가입, 서버 데이터베이스, 카드사 실시간 잔액·결제 연동, 복지 신청 대행, 보호자 모니터링, 실제 푸시 알림은 포함하지 않습니다.
