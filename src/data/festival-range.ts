export const FESTIVAL_LIST_RANGES = ["week", "all"] as const;

export type FestivalListRange = (typeof FESTIVAL_LIST_RANGES)[number];

export const DEFAULT_FESTIVAL_LIST_RANGE: FestivalListRange = "week";

export function isFestivalListRange(value: string): value is FestivalListRange {
  return (FESTIVAL_LIST_RANGES as readonly string[]).includes(value);
}

export function parseFestivalListRange(
  value: string | undefined | null,
): FestivalListRange {
  if (value && isFestivalListRange(value)) return value;
  return DEFAULT_FESTIVAL_LIST_RANGE;
}

/** Days ahead that count as “this week” for the home list default. */
export const FESTIVAL_WEEK_HORIZON_DAYS = 7;
