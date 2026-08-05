/**
 * Builds src/data/uk-festivals.generated.ts from the TripSapien
 * festival calendar (CC BY 4.0), filtered to the UK and geocoded via
 * Open-Meteo.
 *
 * Source: https://github.com/forrestmill-cmd/tripsapien-public-data
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_CSV =
  "https://raw.githubusercontent.com/forrestmill-cmd/tripsapien-public-data/main/data/festival-calendar-2026-2027.csv";

const GEOCODE =
  "https://geocoding-api.open-meteo.com/v1/search";

/** Approximate centroids when the source uses a county / venue label. */
const AREA_COORDS: Record<string, { lat: number; lon: number }> = {
  buckinghamshire: { lat: 51.8167, lon: -0.8125 },
  buckinham: { lat: 51.8167, lon: -0.8125 },
  cambridgeshire: { lat: 52.2053, lon: 0.1218 },
  cornwall: { lat: 50.266, lon: -5.0527 },
  dorset: { lat: 50.748, lon: -2.344 },
  hampshire: { lat: 51.0577, lon: -1.3081 },
  hertfordshire: { lat: 51.8097, lon: -0.2377 },
  lincolnshire: { lat: 53.234, lon: -0.538 },
  monmouthsire: { lat: 51.812, lon: -2.716 },
  monmouthshire: { lat: 51.812, lon: -2.716 },
  northamptonshire: { lat: 52.24, lon: -0.902 },
  nottinghamshire: { lat: 53.1, lon: -1.0 },
  oxfordshire: { lat: 51.752, lon: -1.2577 },
  stirlingshire: { lat: 56.1165, lon: -3.9369 },
  warwickshire: { lat: 52.2823, lon: -1.5849 },
  "clifton down": { lat: 51.466, lon: -2.62 },
  "london stadium": { lat: 51.5386, lon: -0.0164 },
  "london (southall)": { lat: 51.511, lon: -0.375 },
  southall: { lat: 51.511, lon: -0.375 },
  "newstead village": { lat: 53.078, lon: -1.222 },
  "ottery saint mary": { lat: 50.751, lon: -3.278 },
  "ottery st mary": { lat: 50.751, lon: -3.278 },
  "wimbledon, london": { lat: 51.4214, lon: -0.2064 },
  wimbledon: { lat: 51.4214, lon: -0.2064 },
  лидс: { lat: 53.8008, lon: -1.5491 },
  leeds: { lat: 53.8008, lon: -1.5491 },
};

type RawRow = Record<string, string>;

export type GeneratedFestival = {
  id: string;
  name: string;
  location: string;
  country: "GB";
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  website: string;
  source: "tripsapien";
  category: string;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function parseCsv(text: string): RawRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  return body.map((cells) => {
    const out: RawRow = {};
    header.forEach((key, idx) => {
      out[key] = cells[idx] ?? "";
    });
    return out;
  });
}

function cleanWebsite(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("Special:Search")) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function areaLookup(city: string): { lat: number; lon: number } | null {
  const key = city.trim().toLowerCase();
  if (AREA_COORDS[key]) return AREA_COORDS[key];
  const paren = key.match(/\(([^)]+)\)/);
  if (paren && AREA_COORDS[paren[1].trim()]) {
    return AREA_COORDS[paren[1].trim()];
  }
  const beforeComma = key.split(",")[0]?.trim();
  if (beforeComma && AREA_COORDS[beforeComma]) {
    return AREA_COORDS[beforeComma];
  }
  return null;
}

function queryVariants(city: string): string[] {
  const trimmed = city.trim();
  const variants = [trimmed];
  const paren = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    variants.push(paren[2].trim(), paren[1].trim());
  }
  if (trimmed.includes(",")) {
    variants.push(trimmed.split(",")[0]!.trim());
    variants.push(trimmed.split(",").at(-1)!.trim());
  }
  // Cyrillic Leeds label in source data
  if (/лидс/i.test(trimmed)) variants.push("Leeds");
  return [...new Set(variants.filter(Boolean))];
}

async function geocodeQuery(
  name: string,
): Promise<{ lat: number; lon: number } | null> {
  const url = new URL(GEOCODE);
  url.searchParams.set("name", name);
  url.searchParams.set("countryCode", "GB");
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: Array<{ latitude: number; longitude: number }>;
  };
  const hit = data.results?.[0];
  return hit ? { lat: hit.latitude, lon: hit.longitude } : null;
}

async function geocodeCity(
  city: string,
  cache: Map<string, { lat: number; lon: number } | null>,
): Promise<{ lat: number; lon: number } | null> {
  const key = city.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const fromArea = areaLookup(city);
  if (fromArea) {
    cache.set(key, fromArea);
    return fromArea;
  }

  for (const variant of queryVariants(city)) {
    const coords = await geocodeQuery(variant);
    await sleep(120);
    if (coords) {
      cache.set(key, coords);
      return coords;
    }
  }

  cache.set(key, null);
  return null;
}

function assignUniqueIds(items: Omit<GeneratedFestival, "id">[]): GeneratedFestival[] {
  const used = new Set<string>();
  return items.map((item) => {
    const base = slugify(item.name) || "festival";
    const withYear = `${base}-${item.startDate.slice(0, 4)}`;
    let id = used.has(base) ? withYear : base;
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    used.add(id);
    return { ...item, id };
  });
}

const res = await fetch(SOURCE_CSV);
if (!res.ok) {
  throw new Error(`Failed to download festival calendar (${res.status})`);
}

const raw = parseCsv(await res.text());
const uk = raw.filter((row) => (row.country_code || "").toUpperCase() === "GB");

const candidates = uk.filter((row) => {
  if (!row.title?.trim() || !row.city?.trim()) return false;
  if (!row.start_date || !row.end_date) return false;
  if (row.start_date > row.end_date) return false;
  // Skip empty precision only when dates look incomplete
  return true;
});

const geocodeCache = new Map<string, { lat: number; lon: number } | null>();
const drafted: Omit<GeneratedFestival, "id">[] = [];
let skippedNoGeo = 0;

for (const row of candidates) {
  const coords = await geocodeCity(row.city, geocodeCache);
  if (!coords) {
    skippedNoGeo++;
    console.warn(`No geocode for ${row.city} (${row.title})`);
    continue;
  }

  const location = [row.city, row.state_province].filter(Boolean).join(", ");

  drafted.push({
    name: row.title.trim(),
    location,
    country: "GB",
    lat: coords.lat,
    lon: coords.lon,
    startDate: row.start_date,
    endDate: row.end_date,
    website: cleanWebsite(row.event_url),
    source: "tripsapien",
    category: row.category || row.event_type || "festival",
  });
}

const festivals = assignUniqueIds(drafted).sort((a, b) =>
  a.startDate === b.startDate
    ? a.name.localeCompare(b.name)
    : a.startDate.localeCompare(b.startDate),
);

const attribution =
  "TripSapien public festival calendar (CC BY 4.0) https://github.com/forrestmill-cmd/tripsapien-public-data";

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/uk-festivals.generated.ts",
);

await writeFile(
  outPath,
  `/* eslint-disable */
/**
 * Auto-generated by scripts/import-uk-festivals.mts — do not edit by hand.
 * ${attribution}
 * Generated ${new Date().toISOString()}
 */
export type GeneratedFestival = {
  id: string;
  name: string;
  location: string;
  country: "GB";
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  website: string;
  source: "tripsapien";
  category: string;
};

export const generatedUkFestivals: GeneratedFestival[] = ${JSON.stringify(festivals, null, 2)};
`,
);

console.log(
  `Wrote ${festivals.length} UK festivals to ${outPath} (skipped ${skippedNoGeo} without geocode; ${geocodeCache.size} cities cached).`,
);
