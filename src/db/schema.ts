import {
  date,
  doublePrecision,
  index,
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
  ],
);

export type FestivalRow = typeof festivals.$inferSelect;
export type NewFestivalRow = typeof festivals.$inferInsert;
