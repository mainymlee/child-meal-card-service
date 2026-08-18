// Every "now"/date-getter in this app is meant to reflect Korean wall-clock
// time (급식카드 사용은 KST 기준). Vercel's server runs in UTC while a user's
// browser runs in local time, so plain `new Date()` + `.getMonth()`/`.getDate()`/
// `.getHours()` can disagree between server and client render passes across a
// day boundary — this both computes the wrong day for Korean users and causes
// React hydration mismatches on pages that are server-rendered once and then
// hydrated client-side. Route everything through these helpers instead.

export function toSeoulDate(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
}

export function nowInSeoul(): Date {
  return toSeoulDate(new Date());
}
