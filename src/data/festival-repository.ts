import { and, asc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { cache } from "react";
import {
  DEFAULT_FESTIVAL_CATEGORY,
  isFestivalCategory,
  type FestivalCategory,
} from "@/data/festival-categories";
import {
  DEFAULT_FESTIVAL_LIST_RANGE,
  FESTIVAL_WEEK_HORIZON_DAYS,
  type FestivalListRange,
} from "@/data/festival-range";
import {
  compareFestivalsByPopularityThenDate,
  festivalSeed,
  type Festival,
} from "@/data/festivals";
import { getDb } from "@/db/client";
import { festivals as festivalsTable } from "@/db/schema";
import type { FestivalRow } from "@/db/schema";

export type { FestivalListRange } from "@/data/festival-range";

let warnedNoDatabase = false;

function warnNoDatabase(): void {
  if (warnedNoDatabase) return;
  warnedNoDatabase = true;
  console.warn(
    "[festivals] DATABASE_URL is not set — serving the built-in festival list. Run `npm run db:seed` once a database is configured.",
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Still on or not yet started — hide festivals that have already finished. */
function isActiveOrUpcoming(festival: Festival, today = todayIso()): boolean {
  return festival.endDate >= today;
}

/** Overlaps the next N days: still active and starts on or before the horizon. */
function overlapsWeek(
  festival: Festival,
  today = todayIso(),
  horizonDays = FESTIVAL_WEEK_HORIZON_DAYS,
): boolean {
  const horizon = addDaysIso(today, horizonDays);
  return festival.endDate >= today && festival.startDate <= horizon;
}

function matchesRange(
  festival: Festival,
  range: FestivalListRange,
  today = todayIso(),
): boolean {
  if (range === "week") return overlapsWeek(festival, today);
  return isActiveOrUpcoming(festival, today);
}

function rowCategory(value: string): FestivalCategory {
  return isFestivalCategory(value) ? value : DEFAULT_FESTIVAL_CATEGORY;
}

function toFestival(row: FestivalRow): Festival {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    country: row.country,
    lat: row.lat,
    lon: row.lon,
    startDate: row.startDate,
    endDate: row.endDate,
    website: row.website,
    iconUrl: row.iconUrl,
    category: rowCategory(row.category),
    popularityRank: row.popularityRank ?? 0,
  };
}

function seedSorted(
  category: FestivalCategory,
  range: FestivalListRange,
): Festival[] {
  return [...festivalSeed]
    .filter((f) => matchesRange(f, range) && f.category === category)
    .sort(compareFestivalsByPopularityThenDate);
}

function seedFiltered(
  category: FestivalCategory,
  range: FestivalListRange,
  query?: string,
): Festival[] {
  const sorted = seedSorted(category, range);
  const q = query?.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter(
    (f) =>
      f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q),
  );
}

const popularityThenDate = [
  sql`case when ${festivalsTable.popularityRank} > 0 then 0 else 1 end`,
  asc(festivalsTable.popularityRank),
  asc(festivalsTable.startDate),
] as const;

/**
 * Festivals ordered by curated popularity, then start date. Filtering happens
 * in SQL so the list can grow without shipping every row to the client.
 *
 * - `week` (default): dates overlap the next 7 days
 * - `all`: any upcoming / currently-running event
 */
export const listFestivals = cache(
  async (
    query?: string,
    category: FestivalCategory = DEFAULT_FESTIVAL_CATEGORY,
    range: FestivalListRange = DEFAULT_FESTIVAL_LIST_RANGE,
  ): Promise<Festival[]> => {
    const db = getDb();
    if (!db) {
      warnNoDatabase();
      return seedFiltered(category, range, query);
    }

    const q = query?.trim();
    const today = todayIso();
    const conditions = [
      gte(festivalsTable.endDate, today),
      eq(festivalsTable.category, category),
    ];
    if (range === "week") {
      conditions.push(
        lte(
          festivalsTable.startDate,
          addDaysIso(today, FESTIVAL_WEEK_HORIZON_DAYS),
        ),
      );
    }
    if (q) {
      conditions.push(
        or(
          ilike(festivalsTable.name, `%${q}%`),
          ilike(festivalsTable.location, `%${q}%`),
        )!,
      );
    }

    try {
      const rows = await db
        .select()
        .from(festivalsTable)
        .where(and(...conditions))
        .orderBy(...popularityThenDate);

      return rows.map(toFestival);
    } catch (error) {
      console.error(
        "[festivals] Database query failed — falling back to the built-in list:",
        error,
      );
      return seedFiltered(category, range, query);
    }
  },
);

export const getFestivalById = cache(
  async (id: string): Promise<Festival | undefined> => {
    const db = getDb();
    if (!db) {
      warnNoDatabase();
      return festivalSeed.find((f) => f.id === id);
    }

    try {
      const rows = await db
        .select()
        .from(festivalsTable)
        .where(eq(festivalsTable.id, id))
        .limit(1);

      return rows[0] ? toFestival(rows[0]) : undefined;
    } catch (error) {
      console.error(
        "[festivals] Database query failed — falling back to the built-in list:",
        error,
      );
      return festivalSeed.find((f) => f.id === id);
    }
  },
);
