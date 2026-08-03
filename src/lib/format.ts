export function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const sameMonth =
    s.getUTCFullYear() === e.getUTCFullYear() &&
    s.getUTCMonth() === e.getUTCMonth();

  if (sameMonth) {
    return `${s.getUTCDate()}–${e.toLocaleDateString("en-GB", opts)} ${e.getUTCFullYear()}`;
  }
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`;
}

export function conditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    clear: "Clear",
    partly_cloudy: "Partly cloudy",
    cloudy: "Cloudy",
    rain: "Rain",
    heavy_rain: "Heavy rain",
    storm: "Storms",
    snow: "Snow",
    fog: "Fog",
    unknown: "—",
  };
  return labels[condition] ?? condition;
}

/** Festival days still ahead of us, so partial forecast coverage can be flagged. */
export function remainingFestivalDays(
  startDate: string,
  endDate: string,
): number {
  const today = new Date().toISOString().slice(0, 10);
  const from = startDate < today ? today : startDate;
  const span =
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000;
  return Math.max(0, Math.round(span) + 1);
}
