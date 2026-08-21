import type { RecommendationReason, RecommendationScoreBreakdown } from "./types";

export function explainRecommendation(
  score: RecommendationScoreBreakdown,
  price: number,
  dailyRecommended: number
): RecommendationReason[] {
  const spendingLabel = dailyRecommended > 0
    ? `오늘 권장액 ${dailyRecommended.toLocaleString()}원에 맞춰 고른 메뉴예요.`
    : "현재 남은 잔액 범위에서 고른 메뉴예요.";
  const reasons: RecommendationReason[] = [
    { code: "spending-pace", label: spendingLabel, contribution: score.spendingPace },
  ];

  const optional: RecommendationReason[] = [
    { code: "nutrition", label: "최근 식사의 영양 균형을 보완해요.", contribution: score.nutrition },
    { code: "preference", label: "최근 만족도와 취향을 반영했어요.", contribution: score.preference },
    { code: "distance", label: "선택한 지역에서 이동 부담이 적어요.", contribution: score.distance },
    { code: "confidence", label: "메뉴 정보의 확인 수준을 함께 고려했어요.", contribution: score.confidence },
  ];
  reasons.push(...optional.filter((reason) => reason.contribution > 0).sort(
    (a, b) => b.contribution - a.contribution
  ).slice(0, 2));

  if (price > dailyRecommended && dailyRecommended > 0) {
    reasons[0] = {
      ...reasons[0],
      label: `오늘 권장액보다 ${(price - dailyRecommended).toLocaleString()}원 높지만 남은 잔액 안에서 선택했어요.`,
    };
  }
  return reasons;
}
