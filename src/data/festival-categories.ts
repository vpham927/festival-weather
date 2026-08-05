export const FESTIVAL_CATEGORIES = [
  "music",
  "film",
  "food",
  "other",
] as const;

export type FestivalCategory = (typeof FESTIVAL_CATEGORIES)[number];

export const FESTIVAL_CATEGORY_LABELS: Record<FestivalCategory, string> = {
  music: "Music Festivals",
  film: "Film",
  food: "Food",
  other: "Other",
};

export const DEFAULT_FESTIVAL_CATEGORY: FestivalCategory = "music";

export function isFestivalCategory(value: string): value is FestivalCategory {
  return (FESTIVAL_CATEGORIES as readonly string[]).includes(value);
}

export function parseFestivalCategory(
  value: string | undefined | null,
): FestivalCategory {
  if (value && isFestivalCategory(value)) return value;
  return DEFAULT_FESTIVAL_CATEGORY;
}

/** Map TripSapien (or free-text) labels onto the four app categories. */
export function normalizeFestivalCategory(raw: string): FestivalCategory {
  const c = raw.trim().toLowerCase();
  if (!c) return "other";
  if (c.includes("music") || c.includes("dance")) return "music";
  if (c.includes("film")) return "film";
  if (c.includes("food")) return "food";
  return "other";
}
