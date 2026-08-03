import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let client: Database | null | undefined;

/**
 * Returns the Neon-backed Drizzle client, or null when DATABASE_URL is unset so
 * callers can fall back to bundled data instead of crashing.
 */
export function getDb(): Database | null {
  if (client !== undefined) return client;

  const url = process.env.DATABASE_URL?.trim();
  client = url ? drizzle(neon(url), { schema }) : null;
  return client;
}
