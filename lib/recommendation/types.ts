import type {
  Dong,
  MealFeedback,
  MealLogEntry,
  Store,
} from "@/lib/types";

export const RECOMMENDATION_ALGORITHM_VERSION = "2.0.0-alpha.1";

export type DiningMode = "solo" | "together";
export type ServiceMode = "dine-in" | "takeout" | "any";
export type LocationSource = "gps" | "dong-center";
export type DataConfidence = "high" | "medium" | "low";

export interface UserFoodPreferences {
  dislikedKeywords: string[];
  allergyKeywords: string[];
  spiceLevel: "mild" | "normal" | "spicy";
  portion: "small" | "normal" | "large";
  maxWalkingMeters?: number;
}

export interface SpendingPlanContext {
  remainingBalance: number;
  remainingDays: number;
  dailyRecommended: number;
  recommendedUpperBound: number;
  officialDailyLimit: number | null;
  expiringAmount: number;
  cycleEnd: string;
}

export interface RecommendationContext {
  neighborhood: Dong;
  spendingPlan: SpendingPlanContext;
  diningMode: DiningMode;
  serviceMode: ServiceMode;
  now: Date;
  hourOverride?: number | null;
  location: {
    lat: number;
    lng: number;
    source: LocationSource;
  };
  mealHistory: MealLogEntry[];
  feedback: MealFeedback[];
  preferences: UserFoodPreferences;
  reports: Record<string, number>;
}

export type RecommendationReasonCode =
  | "spending-pace"
  | "nutrition"
  | "preference"
  | "distance"
  | "budget"
  | "variety"
  | "confidence";

export interface RecommendationReason {
  code: RecommendationReasonCode;
  label: string;
  contribution: number;
}

export interface RecommendationScoreBreakdown {
  spendingPace: number;
  base: number;
  nutrition: number;
  preference: number;
  feedback: number;
  budget: number;
  distance: number;
  confidence: number;
  repetitionPenalty: number;
  negativeFeedbackPenalty: number;
}

export interface RecommendationResult {
  algorithmVersion: typeof RECOMMENDATION_ALGORITHM_VERSION;
  generatedAt: string;
  store: Store;
  menuName: string;
  estimatedPrice: number;
  totalScore: number;
  score: RecommendationScoreBreakdown;
  reasons: RecommendationReason[];
  warnings: string[];
  relaxedConditions: string[];
  dataConfidence: DataConfidence;
}

export const DEFAULT_FOOD_PREFERENCES: UserFoodPreferences = {
  dislikedKeywords: [],
  allergyKeywords: [],
  spiceLevel: "normal",
  portion: "normal",
};
