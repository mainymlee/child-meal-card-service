import type { ExpMode } from "./types";

export interface CycleInfo {
  cycleEnd: Date;
  remainingDays: number;
}

export interface BalancePlan extends CycleInfo {
  dailyRecommended: number;
  dailySpendNeeded: number;
  recommendedUpperBound: number;
  expiringAmount: number;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetweenInclusive(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return (
    Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay) + 1
  );
}

/**
 * "month": balance is assumed to expire at the end of the current month
 * (conservative default). "year": balance carries over month to month and
 * only expires at year end — mirrors the regional inconsistency the app
 * flags to the user (some regions carry over, some don't; unconfirmed for
 * Chuncheon, so "month" is the safer default).
 */
export function getCycleInfo(today: Date, expMode: ExpMode = "month"): CycleInfo {
  const cycleEnd =
    expMode === "year"
      ? new Date(today.getFullYear(), 11, 31)
      : new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { cycleEnd, remainingDays: daysBetweenInclusive(today, cycleEnd) };
}

export const DAILY_MEAL_SUPPORT_STANDARD = 10_000;

/**
 * The support standard stays at 10,000 won. The separate spend-needed value
 * is fixed when the balance is recorded, so stale balances do not make it
 * rise every day without a new balance entry.
 */
export function calcBalancePlan(
  balance: number,
  today: Date,
  expMode: ExpMode = "month",
  balanceUpdatedAt?: Date | null
): BalancePlan {
  const { cycleEnd, remainingDays } = getCycleInfo(today, expMode);
  const updatedInCurrentCycle = balanceUpdatedAt != null &&
    balanceUpdatedAt <= today &&
    (expMode === "year"
      ? balanceUpdatedAt.getFullYear() === today.getFullYear()
      : balanceUpdatedAt.getFullYear() === today.getFullYear() &&
        balanceUpdatedAt.getMonth() === today.getMonth());
  const planStartedAt = updatedInCurrentCycle ? balanceUpdatedAt : today;
  const plannedDays = getCycleInfo(planStartedAt, expMode).remainingDays;
  const rawDaily = balance / plannedDays;
  const dailySpendNeeded = Math.max(0, Math.ceil(rawDaily / 100) * 100);
  const dailyRecommended = DAILY_MEAL_SUPPORT_STANDARD;
  const recommendedUpperBound = DAILY_MEAL_SUPPORT_STANDARD;
  const expiringAmount = Math.max(
    0,
    balance - DAILY_MEAL_SUPPORT_STANDARD * remainingDays
  );

  return { cycleEnd, remainingDays, dailyRecommended, dailySpendNeeded, recommendedUpperBound, expiringAmount };
}
