import { and, asc, eq, gte, ilike, or } from "drizzle-orm";
import { cache } from "react";
import {
  DEFAULT_FESTIVAL_CATEGORY,
  isFestivalCategory,
  type FestivalCategory,
} from "@/data/festival-categories";
import { festivalSeed, type Festival } from "@/data/festivals";
import { getDb } from "@/db/client";
import { festivals as festivalsTable } from "@/db/schema";
import type { FestivalRow } from "@/db/schema";

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

/** Still on or not yet started — hide festivals that have already finished. */
function isActiveOrUpcoming(festival: Festival, today = todayIso()): boolean {
  return festival.endDate >= today;
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
  };
}

function seedSorted(category: FestivalCategory): Festival[] {
  return [...festivalSeed]
    .filter((f) => isActiveOrUpcoming(f) && f.category === category)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function seedFiltered(category: FestivalCategory, query?: string): Festival[] {
  const sorted = seedSorted(category);
  const q = query?.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter(
    (f) =>
      f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q),
  );
}

/**
 * Festivals ordered by start date. Only upcoming and currently-running events
 * are returned. Filtering happens in SQL so the list can grow worldwide without
 * shipping every row to the client.
 */
export const listFestivals = cache(
  async (
    query?: string,
    category: FestivalCategory = DEFAULT_FESTIVAL_CATEGORY,
  ): Promise<Festival[]> => {
    const db = getDb();
    if (!db) {
      warnNoDatabase();
      return seedFiltered(category, query);
    }

    const q = query?.trim();
    const today = todayIso();
    const active = gte(festivalsTable.endDate, today);
    const byCategory = eq(festivalsTable.category, category);

    try {
      const rows = await (q
        ? db
            .select()
            .from(festivalsTable)
            .where(
              and(
                active,
                byCategory,
                or(
                  ilike(festivalsTable.name, `%${q}%`),
                  ilike(festivalsTable.location, `%${q}%`),
                ),
              ),
            )
            .orderBy(asc(festivalsTable.startDate))
        : db
            .select()
            .from(festivalsTable)
            .where(and(active, byCategory))
            .orderBy(asc(festivalsTable.startDate)));

      return rows.map(toFestival);
    } catch (error) {
      console.error(
        "[festivals] Database query failed — falling back to the built-in list:",
        error,
      );
      return seedFiltered(category, query);
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
