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
};

/** Default icon URL from a festival website host (Google favicon service). */
export function iconUrlFromWebsite(website: string, size = 64): string {
  try {
    const host = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`;
  } catch {
    return "";
  }
}

function festival(
  partial: Omit<Festival, "iconUrl"> & { iconUrl?: string },
): Festival {
  return {
    ...partial,
    iconUrl: partial.iconUrl ?? iconUrlFromWebsite(partial.website),
  };
}

/**
 * Curated UK list. Seeds the database and doubles as the fallback when no
 * DATABASE_URL is configured.
 */
export const festivalSeed: Festival[] = [
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
    startDate: "2026-08-06",
    endDate: "2026-08-09",
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
