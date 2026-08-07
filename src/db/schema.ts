import {
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const festivals = pgTable(
  "festivals",
  {
    /** Human-readable slug, also used in URLs. */
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    /** ISO 3166-1 alpha-2, ready for a worldwide list. */
    country: text("country").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    website: text("website").notNull().default(""),
    /** Favicon or brand icon URL shown next to the festival name. */
    iconUrl: text("icon_url").notNull().default(""),
    /** App category: music | film | food | other */
    category: text("category").notNull().default("other"),
    /**
     * Curated popularity. 0 = not featured; 1+ = featured order
     * (lower number = higher on the list).
     */
    popularityRank: integer("popularity_rank").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("festivals_start_date_idx").on(table.startDate),
    index("festivals_country_idx").on(table.country),
    index("festivals_category_idx").on(table.category),
    index("festivals_popularity_rank_idx").on(table.popularityRank),
  ],
);

export type FestivalRow = typeof festivals.$inferSelect;
export type NewFestivalRow = typeof festivals.$inferInsert;
