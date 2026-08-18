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

export function getCycleInfo(today: Date): CycleInfo {
  const cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const remainingDays =
    Math.round(
      (startOfDay(cycleEnd).getTime() - startOfDay(today).getTime()) / msPerDay
    ) + 1;
  return { cycleEnd, remainingDays };
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
export function calcBalancePlan(balance: number, today: Date): BalancePlan {
  const { cycleEnd, remainingDays } = getCycleInfo(today);
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
