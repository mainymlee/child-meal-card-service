import type { ExpMode } from "./types";

export interface CycleInfo {
  cycleEnd: Date;
  remainingDays: number;
}

export interface BalancePlan extends CycleInfo {
  dailyRecommended: number;
  dailyLimit: number;
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

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * dailyRecommended/dailyLimit are derived arithmetically from the balance.
 * expiringAmount is the rounding residue if the user spends exactly
 * dailyRecommended every remaining day — it is not meant to reproduce any
 * specific illustrative figure, just to reflect what rounding leaves over.
 */
export function calcBalancePlan(
  balance: number,
  today: Date,
  expMode: ExpMode = "month"
): BalancePlan {
  const { cycleEnd, remainingDays } = getCycleInfo(today, expMode);
  const rawDaily = balance / remainingDays;
  const dailyRecommended = Math.max(0, roundTo(Math.floor(rawDaily), 100));
  const dailyLimit = Math.max(
    dailyRecommended,
    Math.ceil((dailyRecommended * 1.4) / 1000) * 1000
  );
  const expiringAmount = Math.max(
    0,
    balance - dailyRecommended * remainingDays
  );

  return { cycleEnd, remainingDays, dailyRecommended, dailyLimit, expiringAmount };
}
