export type StoreCategory =
  | "한식"
  | "일반대중음식"
  | "중식"
  | "제과점"
  | "일식"
  | "양식"
  | "패스트푸드";

export interface MenuItem {
  name: string;
  price: number;
  underBudget: boolean;
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
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  hours: { open: string; close: string };
  badges: StoreBadges;
  menu: MenuItem[];
}

export interface StoresFile {
  generatedAt: string;
  sourceFile: string;
  count: number;
  placeholderCoordinates: boolean;
  stores: Store[];
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
