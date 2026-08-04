import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { festivalSeed } from "../src/data/festivals.ts";
import { festivals } from "../src/db/schema.ts";

const url = process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.local.example) before seeding.",
  );
  process.exit(1);
}

const db = drizzle(neon(url), { schema: { festivals } });

await db
  .insert(festivals)
  .values(festivalSeed)
  .onConflictDoUpdate({
    target: festivals.id,
    set: {
      name: sql`excluded.name`,
      location: sql`excluded.location`,
      country: sql`excluded.country`,
      lat: sql`excluded.lat`,
      lon: sql`excluded.lon`,
      startDate: sql`excluded.start_date`,
      endDate: sql`excluded.end_date`,
      website: sql`excluded.website`,
      iconUrl: sql`excluded.icon_url`,
      updatedAt: sql`now()`,
    },
  });

const [{ count }] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(festivals);

console.log(
  `Seeded ${festivalSeed.length} festivals. Table now holds ${count} rows.`,
);
