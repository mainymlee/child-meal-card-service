export type Dong = "후평동" | "석사동" | "퇴계동" | "효자동";

export type StoreCategory =
  | "한식"
  | "일반대중음식"
  | "중식"
  | "제과점"
  | "일식"
  | "양식"
  | "패스트푸드"
  | "편의점";

// UI 세그먼트(전체/한식/중식/양식/분식/편의점)용 간소화 카테고리.
// 매핑은 lib/taxonomy.ts의 CATEGORY_TO_CAT2 참고.
export type SimplifiedCategory = "kr" | "cn" | "wf" | "bs" | "cvs";

// 영양 다양성 스코어링용 그룹. 기준 점수는 lib/taxonomy.ts의 GRP_BASE_SCORE.
export type NutritionGroup =
  | "백반·정식"
  | "국·찌개"
  | "구이·볶음"
  | "분식"
  | "중식"
  | "베이커리"
  | "일식"
  | "양식·돈까스"
  | "편의점"
  | "기타"; // 방문 후 기록 시트의 "다른 걸 먹었어요" 선택지 — 어떤 가게의 grp로도 배정되지 않는다

export type FamilyType =
  | "한부모가정"
  | "조손가정"
  | "다문화가정"
  | "기초생활수급";

export type SchoolLevel = "초등학생" | "중학생" | "고등학생";

export interface Profile {
  familyType: FamilyType;
  schoolLevel: SchoolLevel;
}

export interface NotifPrefs {
  monthly: boolean;
  dday: boolean;
}

export type ExpMode = "month" | "year";

export interface MenuItem {
  name: string;
  price: number;
  underBudget: boolean;
}

export interface MealLogEntry {
  grp: NutritionGroup;
  menuName: string | null;
  eatenAt: string | null;
}

export type FeedbackReason = "taste" | "distance" | "price" | "portion" | "spicy" | "repeat";

export interface MealFeedback {
  storeId: string;
  grp: NutritionGroup;
  menuName: string;
  satisfaction: -1 | 0 | 1;
  reason: FeedbackReason | null;
  createdAt: string;
}

export interface StoreBadges {
  soloFriendly: boolean;
  takeoutAvailable: boolean;
  paymentConfirmed: boolean;
  paymentConfirmedDate: string | null;
}

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  cat2: SimplifiedCategory;
  grp: NutritionGroup;
  neighborhood: Dong;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  hours: { open: string; close: string };
  closedDays: number[]; // 0=일요일..6=토요일
  breakTime: string | null;
  hoursEst: boolean; // true면 "확인 필요" 표시
  counterDescription: string;
  badges: StoreBadges;
  menu: MenuItem[];
  menuSource:
    | "store-verified"
    | "brand-official"
    | "name-derived"
    | "category-derived"
    | "unverified";
  menuVerification?: {
    sourceType: "store-confirmed" | "brand-official";
    sourceUrl: string | null;
    verifiedAt: string;
    note: string | null;
  };
}

export interface StoresFile {
  generatedAt: string;
  sourceFile: string;
  count: number;
  placeholderCoordinates: boolean;
  stores: Store[];
  menuRefinedAt?: string;
  menuVerifiedAt?: string;
  menuSourceCounts?: Record<string, number>;
}

export interface WelfarePolicy {
  id: string;
  title: string;
  description: string;
  amount: string;
  org: string;
  link: string;
  status: "이용중" | "신청가능";
  eligibility: string[];
}

export interface WelfareFile {
  persona: {
    type: string;
    age: number;
    region: string;
    schoolLevel: string;
  };
  policies: WelfarePolicy[];
}
