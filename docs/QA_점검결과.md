# QA 점검 결과 (2026-08-21)

전체 코드베이스에 대한 자동 검증과 코드 리뷰 결과입니다.

## 조치 결과

2026-08-21 후속 개발에서 아래 항목을 반영했습니다.

| 기존 항목 | 조치 |
| --- | --- |
| 방문 시트 오귀속 | 타이머를 ref로 관리하고 상세 화면 언마운트 시 취소 |
| 챗봇 부정어 오분류 | `말고`, `아니고`, `빼고`가 붙은 편의점 의도 제외 및 회귀 테스트 추가 |
| 매운맛 페널티 전체 확산 | 최근 20건 중 동일 가게 또는 동일 음식군 피드백으로 범위 제한 |
| 부정 피드백 미감쇠 | 최근 20건만 사용하고 최신 기록일수록 높은 가중치 적용 |
| 디자인 리소스 라우트 | 파일 읽기 실패를 처리하고 503·`no-store` 응답 제공 |
| GPS 거리 상한 | GPS 후보를 현재 위치 5km 반경으로 제한하고 기본 도보 상한도 5km로 설정 |
| 잔액 부족 설명 | 잔액이 1만원보다 적으면 실제 남은 잔액 기준으로 설명 |
| 저장 실패 | 메모리 상태 유지, 사용자 토스트 안내, 탭 간 `storage` 동기화 추가 |
| 알 수 없는 음식군 | 기본 점수 0 fallback으로 `NaN` 방지 |
| 지도 마커 재생성 | 위치·필터·검색 결과와 마커 배열 메모이제이션 |
| 시트 접근성 | Esc 닫기, 포커스 트랩, 닫힌 시트 inert 처리, 기존 포커스 복귀 |
| 토스트 타이머 | 프로바이더 언마운트 시 타이머 정리 |
| 상세 거리 불일치(추가 발견) | GPS 사용 중 상세 화면도 같은 GPS 좌표로 거리 계산 |

검증 명령은 후속 변경 완료 후 다시 실행하며, 아래 내용은 최초 발견 당시의 기록으로 보존합니다.

## 자동 검증

| 항목 | 명령 | 결과 |
| --- | --- | --- |
| Lint | `npm run lint` | ✅ 통과 |
| 타입체크 | `tsc --noEmit` | ✅ 에러 없음 |
| 빌드 | `npm run build` | ✅ 17개 라우트 정상 빌드 |
| AI 추천 검증 | `npm run validate-ai` | ✅ 11/11 통과 |

## 실제 버그 (우선순위 높음)

### 1. 방문 시트가 엉뚱한 가게에 기록됨
**파일:** [components/store/StoreDetailClient.tsx:40-42](../components/store/StoreDetailClient.tsx#L40-L42)

"길찾기" 클릭 시 1.2초 뒤 `VisitSheet`를 여는 `setTimeout`에 `clearTimeout`이 없습니다. 사용자가 1.2초 안에 다른 가게 상세페이지로 이동하면, 이전 가게 ID로 바인딩된 시트가 새 화면 위에 뜨고 `logMeal`/`logMealFeedback`이 잘못된 가게에 기록됩니다. `OverlayProvider`가 전역이라 실제로 발생 가능한 데이터 정합성 버그입니다.

**제안:** 타이머를 ref에 저장하고 언마운트 시 clear하거나, 시트를 열기 전 현재 페이지가 여전히 해당 store인지 확인.

### 2. 챗봇 자유입력 분류가 부정어를 무시함
**파일:** [lib/chatEngine.ts:139-144](../lib/chatEngine.ts#L139-L144)

`"편의점 말고 밥 먹고 싶어요"` 같은 문장이 "편의점" 키워드에 먼저 걸려 `cvs`로 잘못 분류됩니다. 우선순위 고정 패턴 매칭(cvs → expiry → balance → food → welfare → dong) 방식이라 부정 표현을 걸러내지 못합니다.

**제안:** "말고", "아니고", "말고요" 등 부정 표현이 키워드 앞에 오면 해당 카테고리를 건너뛰도록 처리.

### 3. 매운맛 불만이 전체 가게에 무차별 페널티로 번짐
**파일:** [lib/recommendation/scorer.ts:84](../lib/recommendation/scorer.ts#L84)

가게/메뉴 범위로 스코프된 다른 페널티(58-60줄)와 달리, 이 체크는 `context.feedback` 전체를 가게 구분 없이 훑습니다. 한 번이라도 아무 가게에서 "매워요" 피드백을 남기면 이후 모든 가게의 나트륨 높은 메뉴가 영구적으로 -2점을 받습니다.

**제안:** `storeId`/`grp`로 스코프를 좁히거나, 사용자 전역 성향으로 의도된 것인지 확인 후 주석으로 명시.

### 4. 부정 피드백 페널티는 시간이 지나도 감쇠하지 않음
**파일:** [lib/recommendation/scorer.ts:58-60](../lib/recommendation/scorer.ts#L58-L60)

다른 점수(선호도, 영양)는 최근 20건에 recency decay가 적용되는데, 이 페널티만 전체 피드백 이력을 무제한으로 봅니다. 수개월 전 안 좋은 기록 하나로 이후 좋은 방문이 쌓여도 -10점 캡이 풀리지 않습니다.

**제안:** 다른 점수와 동일하게 최근 N건 + decay 적용.

## 중간 우선순위

### 5. `/v10.css`, `/app-logo.png` 라우트에 에러 처리 없음
**파일:** [app/v10.css/route.ts:7-8](../app/v10.css/route.ts#L7-L8), [app/app-logo.png/route.ts:7-8](../app/app-logo.png/route.ts#L7-L8)

디자인 기준 HTML(`docs/prototypes/한끼_웹앱_v10.html`)을 런타임에 읽는데 try/catch가 없습니다. `layout.tsx`가 앱 전체에 이 CSS를 링크하므로, 원본 파일이 이동/변경되면 앱 전체 스타일이 깨집니다. 정규식 기반 추출(`html.match(/<style>.../)`)도 마크업이 조금만 바뀌면 조용히 500 에러로 이어집니다.

### 6. GPS 최초 사용자에게 거리 상한이 없음
**파일:** [lib/recommendation/eligibility.ts:47](../lib/recommendation/eligibility.ts#L47), [lib/recommendation/types.ts:93-98](../lib/recommendation/types.ts#L93-L98)

GPS 모드에서는 동네 필터를 건너뛰는데, `DEFAULT_FOOD_PREFERENCES`에 `maxWalkingMeters` 기본값이 설정돼 있지 않아 거리로 인한 하드 제외가 전혀 없습니다. 점수만 소폭(최대 -8) 감점될 뿐 전 지역 가게가 "적격" 판정을 받습니다.

### 7. 잔액 부족 시 추천 설명 문구가 부정확함
**파일:** [lib/recommendation/recommend.ts:48-52](../lib/recommendation/recommend.ts#L48-L52), [lib/recommendation/explain.ts:8-10, 25-30](../lib/recommendation/explain.ts#L8-L10)

실제로는 남은 잔액 때문에 저가 메뉴가 강제 선택된 상황에도, 설명은 항상 고정값(10,000원) 기준으로만 비교해 "오늘 권장액 10,000원에 맞춰 골랐다"는 문구가 그대로 뜹니다. 잔액 부족으로 인한 선택이라는 안내가 없습니다.

### 8. localStorage 쓰기 실패 시 UI가 조용히 원상복귀
**파일:** [lib/hooks/createPersistentState.ts:43-56](../lib/hooks/createPersistentState.ts#L43-L56), [lib/hooks/useBalance.tsx:67-73](../lib/hooks/useBalance.tsx#L67-L73)

Safari 프라이빗 모드나 쿼터 초과 시 `localStorage.setItem`이 실패해도 에러를 삼키고 캐시값은 새 값으로 갱신합니다. 다음 렌더링에서 `useSyncExternalStore`가 실제 저장값(이전 값)과 캐시를 비교하며 조용히 되돌리기 때문에, 잔액/즐겨찾기 등의 변경이 순간 반영됐다가 깜빡이며 사라지는 것처럼 보일 수 있습니다.

## 낮은 우선순위 / 참고사항

- **NaN 전파 가능성:** `GRP_BASE_SCORE[store.grp]` 조회에 fallback이 없어, 알 수 없는 `grp` 값이 들어오면 정렬 점수가 `NaN`이 되어 정렬 순서가 조용히 깨질 수 있습니다. ([scorer.ts:75](../lib/recommendation/scorer.ts#L75))
- **지도 성능:** 마커 배열이 메모이즈되지 않아 검색어 입력이나 필터 토글마다 전체 Kakao 마커/클러스터러가 재생성됩니다. ([app/result/page.tsx:170-181](../app/result/page.tsx#L170-L181))
- **접근성:** 시트/모달 컴포넌트 전체(`components/sheets/*`)에 포커스 트랩과 Esc 닫기가 없어 키보드·스크린리더 사용자가 닫기 어렵습니다.
- **탭 간 동기화 없음:** `window`의 `storage` 이벤트를 구독하지 않아, 앱을 두 탭에서 열면 한쪽의 변경이 다른 쪽에 반영되지 않습니다. 단일 기기 사용 전제라면 큰 문제는 아닙니다.
- **토스트 타이머 클린업 없음:** `OverlayProvider`의 토스트 타이머가 언마운트 시 clear되지 않지만, 프로바이더가 앱 루트에 고정돼 있어 현재는 실질적 위험이 낮습니다. ([lib/overlay/OverlayProvider.tsx:30-46](../lib/overlay/OverlayProvider.tsx#L30-L46))
- **메뉴 미확인 데이터:** `data/stores.json` 1,372곳 중 656곳이 메뉴 미확인(`menu: []`) 상태입니다. README에 명시된 의도된 설계(판단 어려운 곳은 추천 제외)로 보이며 크래시 없이 처리되고 있습니다.

## 권장 조치 순서

1. 방문 시트 오귀속 버그 (#1) — 데이터 정합성에 직접 영향
2. 챗봇 오분류 (#2) — 사용자 경험에 직접 영향
3. 매운맛 페널티 스코프 (#3), 부정 피드백 미감쇠 (#4) — 추천 품질에 영향
4. 나머지 중간/낮은 우선순위 항목은 여유 있을 때 순차 처리
