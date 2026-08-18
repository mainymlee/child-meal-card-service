import type {
  Dong,
  NutritionGroup,
  SimplifiedCategory,
  StoreCategory,
} from "./types";

export const NEIGHBORHOODS: Dong[] = ["후평동", "석사동", "퇴계동", "효자동"];

// 원본 업종 -> UI 세그먼트(전체/한식/중식/양식/분식/편의점) 매핑.
// 일반대중음식->kr, 제과점->bs, 패스트푸드->wf는 다소 임의적인 분류 판단이며
// 필요하면 이 표 한 줄만 바꾸면 된다.
export const CATEGORY_TO_CAT2: Record<StoreCategory, SimplifiedCategory> = {
  한식: "kr",
  일반대중음식: "kr",
  중식: "cn",
  제과점: "bs",
  일식: "wf",
  양식: "wf",
  패스트푸드: "wf",
  편의점: "cvs",
};

export const CAT2_LABELS: Record<SimplifiedCategory, string> = {
  kr: "한식",
  cn: "중식",
  wf: "양식",
  bs: "분식",
  cvs: "편의점",
};

// 업종별로 뽑힐 수 있는 영양 그룹 후보 (지오코딩 스크립트가 시드 RNG로 그 중 하나 선택)
export const CATEGORY_TO_GRP_POOL: Record<StoreCategory, NutritionGroup[]> = {
  한식: ["백반·정식", "국·찌개", "구이·볶음"],
  일반대중음식: ["백반·정식", "분식"],
  중식: ["중식"],
  제과점: ["베이커리"],
  일식: ["일식"],
  양식: ["양식·돈까스"],
  패스트푸드: ["양식·돈까스"],
  편의점: ["편의점"],
};

export const GRP_BASE_SCORE: Record<NutritionGroup, number> = {
  "백반·정식": 10,
  "국·찌개": 9,
  "구이·볶음": 8,
  "양식·돈까스": 7,
  일식: 7,
  중식: 6,
  분식: 5,
  베이커리: 5,
  편의점: 2,
  기타: 0, // 어떤 가게의 grp로도 배정되지 않음 — 방문기록 시트 전용 값
};
