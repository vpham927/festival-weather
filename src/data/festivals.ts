import { generatedUkFestivals } from "./uk-festivals.generated.ts";
import { FESTIVAL_WEBSITE_OVERRIDES } from "./festival-website-overrides.ts";
import { officialWebsite } from "./festival-websites.ts";
import {
  DEFAULT_FESTIVAL_CATEGORY,
  normalizeFestivalCategory,
  type FestivalCategory,
} from "./festival-categories.ts";

export type Festival = {
  id: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  /** Official festival site. */
  website: string;
  /** Icon / favicon URL shown next to the name. */
  iconUrl: string;
  category: FestivalCategory;
};

export type { FestivalCategory };

/** Default icon URL from a festival website host (Google favicon service). */
export function iconUrlFromWebsite(website: string, size = 64): string {
  const official = officialWebsite(website);
  if (!official) return "";
  try {
    const host = new URL(official).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
  } catch {
    return "";
  }
}

function festival(
  partial: Omit<Festival, "iconUrl" | "category"> & {
    iconUrl?: string;
    category?: FestivalCategory;
  },
): Festival {
  const website = officialWebsite(partial.website);
  return {
    ...partial,
    website,
    category: partial.category ?? DEFAULT_FESTIVAL_CATEGORY,
    iconUrl: partial.iconUrl ?? iconUrlFromWebsite(website),
  };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b20\d{2}\b/g, "")
    .replace(
      /\b(festival|open air|fair|dorset|international|music)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Hand-curated UK festivals with precise venue coordinates and official
 * websites. These win over generated rows when names match.
 */
export const curatedFestivals: Festival[] = [
  festival({
    id: "camp-bestival",
    name: "Camp Bestival",
    location: "Lulworth Castle, Dorset",
    country: "GB",
    lat: 50.672,
    lon: -2.2447,
    startDate: "2026-07-31",
    endDate: "2026-08-03",
    website: "https://www.campbestival.net",
  }),
  festival({
    id: "wilderness",
    name: "Wilderness Festival",
    location: "Cornbury Park, Oxfordshire",
    country: "GB",
    lat: 51.8767,
    lon: -1.4906,
    startDate: "2026-07-30",
    endDate: "2026-08-02",
    website: "https://www.wildernessfestival.com",
  }),
  festival({
    id: "bloodstock",
    name: "Bloodstock Open Air",
    location: "Catton Park, Derbyshire",
    country: "GB",
    lat: 52.7434,
    lon: -1.642,
    startDate: "2026-08-07",
    endDate: "2026-08-09",
    website: "https://www.bloodstock.uk.com",
  }),
  festival({
    id: "green-man",
    name: "Green Man",
    location: "Glanusk Park, Brecon Beacons",
    country: "GB",
    lat: 51.8757,
    lon: -3.1358,
    startDate: "2026-08-13",
    endDate: "2026-08-16",
    website: "https://www.greenman.net",
  }),
  festival({
    id: "beautiful-days",
    name: "Beautiful Days",
    location: "Escot Park, Devon",
    country: "GB",
    lat: 50.7729,
    lon: -3.2965,
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    website: "https://www.beautifuldays.org",
  }),
  festival({
    id: "all-points-east",
    name: "All Points East",
    location: "Victoria Park, London",
    country: "GB",
    lat: 51.5362,
    lon: -0.04,
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    website: "https://www.allpointseastfestival.com",
  }),
  festival({
    id: "boomtown",
    name: "Boomtown Fair",
    location: "Matterley Estate, Winchester",
    country: "GB",
    lat: 51.0485,
    lon: -1.2412,
    startDate: "2026-08-12",
    endDate: "2026-08-16",
    website: "https://www.boomtownfair.co.uk",
  }),
  festival({
    id: "boardmasters",
    name: "Boardmasters",
    location: "Watergate Bay, Cornwall",
    country: "GB",
    lat: 50.4412,
    lon: -5.0418,
    startDate: "2026-08-12",
    endDate: "2026-08-16",
    website: "https://www.boardmasters.com",
  }),
  festival({
    id: "reading",
    name: "Reading Festival",
    location: "Richfield Avenue, Reading",
    country: "GB",
    lat: 51.4665,
    lon: -0.9914,
    startDate: "2026-08-28",
    endDate: "2026-08-30",
    website: "https://www.readingfestival.com",
  }),
  festival({
    id: "leeds",
    name: "Leeds Festival",
    location: "Bramham Park, Leeds",
    country: "GB",
    lat: 53.8701,
    lon: -1.3812,
    startDate: "2026-08-28",
    endDate: "2026-08-30",
    website: "https://www.leedsfestival.com",
  }),
  festival({
    id: "creamfields",
    name: "Creamfields",
    location: "Daresbury, Cheshire",
    country: "GB",
    lat: 53.3412,
    lon: -2.6318,
    startDate: "2026-08-27",
    endDate: "2026-08-30",
    website: "https://www.creamfields.com",
  }),
  festival({
    id: "glastonbury",
    name: "Glastonbury Festival",
    location: "Worthy Farm, Somerset",
    country: "GB",
    lat: 51.1485,
    lon: -2.5857,
    startDate: "2027-06-23",
    endDate: "2027-06-27",
    website: "https://www.glastonburyfestivals.co.uk",
  }),
  festival({
    id: "download",
    name: "Download Festival",
    location: "Donington Park, Derby",
    country: "GB",
    lat: 52.8298,
    lon: -1.3784,
    startDate: "2027-06-11",
    endDate: "2027-06-13",
    website: "https://downloadfestival.co.uk",
  }),
  festival({
    id: "isle-of-wight",
    name: "Isle of Wight Festival",
    location: "Seaclose Park, Newport",
    country: "GB",
    lat: 50.7062,
    lon: -1.2895,
    startDate: "2027-06-17",
    endDate: "2027-06-20",
    website: "https://isleofwightfestival.com",
  }),
  festival({
    id: "latitude",
    name: "Latitude Festival",
    location: "Henham Park, Suffolk",
    country: "GB",
    lat: 52.3372,
    lon: 1.5978,
    startDate: "2027-07-22",
    endDate: "2027-07-25",
    website: "https://www.latitudefestival.com",
  }),
  festival({
    id: "wireless",
    name: "Wireless Festival",
    location: "Finsbury Park, London",
    country: "GB",
    lat: 51.5712,
    lon: -0.0985,
    startDate: "2027-07-09",
    endDate: "2027-07-11",
    website: "https://www.wirelessfestival.co.uk",
  }),
];

type GeneratedRow = {
  id: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  website: string;
  category: string;
};

function mergeFestivalSeed(
  curated: Festival[],
  generated: GeneratedRow[],
): Festival[] {
  const curatedByNorm = new Map(
    curated.map((f) => [normalizeName(f.name), f] as const),
  );
  const usedCurated = new Set<string>();
  const merged: Festival[] = [];

  for (const row of generated) {
    const match = curatedByNorm.get(normalizeName(row.name));
    if (match) {
      usedCurated.add(match.id);
      merged.push(match);
      continue;
    }
    merged.push(
      festival({
        id: row.id,
        name: row.name,
        location: row.location,
        country: row.country,
        lat: row.lat,
        lon: row.lon,
        startDate: row.startDate,
        endDate: row.endDate,
        website: FESTIVAL_WEBSITE_OVERRIDES[row.id] ?? row.website,
        category: normalizeFestivalCategory(row.category),
      }),
    );
  }

  for (const f of curated) {
    if (!usedCurated.has(f.id)) merged.push(f);
  }

  const byId = new Map<string, Festival>();
  for (const f of merged) {
    // Prefer curated when duplicate ids collide after merge.
    if (!byId.has(f.id) || curated.some((c) => c.id === f.id)) {
      byId.set(f.id, f);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.startDate === b.startDate
      ? a.name.localeCompare(b.name)
      : a.startDate.localeCompare(b.startDate),
  );
}

/**
 * Full UK seed: TripSapien calendar (CC BY 4.0) plus curated overrides.
 * Seeds the database and doubles as the fallback when no DATABASE_URL
 * is configured.
 */
export const festivalSeed: Festival[] = mergeFestivalSeed(
  curatedFestivals,
  generatedUkFestivals,
);
