export function yyyyMmToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

export function calcTotalDays(
  start: string,
  end: string,
  excluded: string[]
): number {
  if (!start || !end) return 0;

  // Force UTC to avoid timezone bugs
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");

  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) {
    return 0;
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Inclusive day count
  const totalDays =
    Math.floor((e.getTime() - s.getTime()) / MS_PER_DAY) + 1;

  // Normalize excluded dates to UTC timestamps
  const excludedSet = new Set(
    excluded.map((d) => new Date(d + "T00:00:00Z").getTime())
  );

  let excludedCount = 0;

  for (let t = s.getTime(); t <= e.getTime(); t += MS_PER_DAY) {
    if (excludedSet.has(t)) {
      excludedCount++;
    }
  }

  return Math.max(0, totalDays - excludedCount);
}

export function formatMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}