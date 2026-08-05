/**
 * Fills missing official festival websites, then rewrites
 * uk-festivals.generated.ts so favicons resolve from real domains.
 *
 * Order per festival:
 * 1. Keep existing non-aggregator website
 * 2. Wikidata P856 (bulk SPARQL)
 * 3. Parse Official Website from listing page (Music Festival Wizard via jina.ai)
 * 4. DuckDuckGo HTML search for "{name} official website"
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isAggregatorWebsite,
  isNoiseWebsite,
  officialWebsite,
} from "../src/data/festival-websites.ts";

type GeneratedFestival = {
  id: string;
  name: string;
  location: string;
  country: "GB";
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  website: string;
  listingUrl?: string;
  source: "tripsapien";
  category: string;
};

const UA_BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const UA_BOT =
  "FestCheck/1.0 (festival weather app; website enrichment; local script)";

const root = path.dirname(fileURLToPath(import.meta.url));
const generatedPath = path.join(root, "../src/data/uk-festivals.generated.ts");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\b(festival|fest|open air|fair|uk|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractFestivalsArray(source: string): GeneratedFestival[] {
  const marker = "export const generatedUkFestivals: GeneratedFestival[] = ";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Could not find generatedUkFestivals export");
  const jsonStart = source.indexOf("= [", start);
  if (jsonStart < 0) throw new Error("Could not find festivals array");
  const arrayStart = jsonStart + 2;
  const jsonEnd = source.lastIndexOf("]");
  if (jsonEnd < arrayStart) throw new Error("Could not parse festivals JSON");
  return JSON.parse(
    source.slice(arrayStart, jsonEnd + 1),
  ) as GeneratedFestival[];
}

async function fetchUkFestivalWebsites(): Promise<Map<string, string>> {
  const queries = [
    `
SELECT DISTINCT ?itemLabel ?website WHERE {
  ?item wdt:P31 wd:Q132241 ;
        wdt:P17 wd:Q145 ;
        wdt:P856 ?website .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim(),
    `
SELECT DISTINCT ?itemLabel ?website WHERE {
  ?item wdt:P31 wd:Q868557 ;
        wdt:P17 wd:Q145 ;
        wdt:P856 ?website .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim(),
    `
SELECT DISTINCT ?itemLabel ?website WHERE {
  ?item wdt:P31 wd:Q4801521 ;
        wdt:P17 wd:Q145 ;
        wdt:P856 ?website .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim(),
  ];

  const map = new Map<string, string>();

  for (const sparql of queries) {
    const url =
      "https://query.wikidata.org/sparql?" +
      new URLSearchParams({ format: "json", query: sparql });

    const res = await fetch(url, {
      headers: {
        "User-Agent": UA_BOT,
        Accept: "application/sparql-results+json",
      },
    });
    if (!res.ok) {
      console.warn(`SPARQL query failed (${res.status}), continuing…`);
      continue;
    }

    const data = (await res.json()) as {
      results: {
        bindings: Array<{
          itemLabel?: { value: string };
          website?: { value: string };
        }>;
      };
    };

    for (const row of data.results.bindings) {
      const label = row.itemLabel?.value;
      const website = row.website?.value;
      if (!label || !website) continue;
      const cleaned = officialWebsite(website);
      if (!cleaned) continue;
      const key = normalizeName(label);
      if (!key || map.has(key)) continue;
      map.set(key, cleaned);
    }
  }

  return map;
}

function scoreCandidate(url: string, festivalName: string): number {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const tokens = normalizeName(festivalName)
      .split(" ")
      .filter((t) => t.length > 2);
    let score = 1;
    for (const token of tokens) {
      if (host.includes(token)) score += 3;
    }
    if (host.endsWith(".co.uk") || host.endsWith(".uk")) score += 1;
    if (host.startsWith("tickets.") || host.startsWith("shop.")) score -= 1;
    return score;
  } catch {
    return 0;
  }
}

function pickBestWebsite(
  urls: string[],
  festivalName: string,
  minScore = 4,
): string | null {
  const scored = urls
    .map((raw) => officialWebsite(raw))
    .filter(Boolean)
    .map((site) => ({ site, score: scoreCandidate(site, festivalName) }))
    .filter((row) => row.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.site ?? null;
}

async function websiteFromListing(listingUrl: string, festivalName: string) {
  if (!listingUrl || !isAggregatorWebsite(listingUrl)) return null;

  const readerUrl = `https://r.jina.ai/${listingUrl.replace(/^https:\/\//, "http://")}`;
  try {
    const res = await fetch(readerUrl, {
      headers: { "User-Agent": UA_BOT, Accept: "text/plain" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const links = [
      ...text.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g),
      ...text.matchAll(/https?:\/\/[^\s)\]>"']+/g),
    ].map((m) => m[1] ?? m[0]);

    // Prefer links near "official"
    const officialNearby: string[] = [];
    for (const match of text.matchAll(
      /official[^\n]{0,80}(https?:\/\/[^\s)\]>"']+)/gi,
    )) {
      officialNearby.push(match[1]!);
    }
    for (const match of text.matchAll(
      /\[[^\]]*official[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi,
    )) {
      officialNearby.push(match[1]!);
    }

    return (
      pickBestWebsite(officialNearby, festivalName, 2) ??
      pickBestWebsite(links, festivalName, 4)
    );
  } catch {
    return null;
  }
}

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

function domainGuesses(festivalName: string): string[] {
  const cleaned = festivalName
    .replace(/\s+20\d{2}\s*$/, "")
    .replace(/\bfestival\b/gi, "")
    .trim();
  const slug = slugify(cleaned);
  const noUk = slug.replace(/-uk$/, "").replace(/^uk-/, "");
  const compact = noUk.replace(/-/g, "");
  const bases = [
    slug,
    noUk,
    compact,
    `${noUk}-festival`,
    `${compact}festival`,
    `${noUk}-fest`,
    `${compact}fest`,
  ];
  const hosts: string[] = [];
  for (const base of bases) {
    const b = base.replace(/^-+|-+$/g, "");
    if (b.length < 4) continue;
    for (const host of [
      `${b}.co.uk`,
      `${b}.com`,
      `www.${b}.co.uk`,
      `www.${b}.com`,
    ]) {
      if (!hosts.includes(host)) hosts.push(host);
    }
  }
  return hosts;
}

async function probeHost(
  host: string,
  festivalName: string,
): Promise<string | null> {
  for (const scheme of ["https", "http"] as const) {
    try {
      const res = await fetch(`${scheme}://${host}/`, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": UA_BROWSER, Accept: "text/html" },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) continue;
      const finalUrl = res.url || `${scheme}://${host}/`;
      if (isNoiseWebsite(finalUrl) || isAggregatorWebsite(finalUrl)) continue;

      const finalHost = new URL(finalUrl).hostname.toLowerCase();
      const stem = host.replace(/^www\./, "").split(".")[0] ?? "";
      const compactStem = stem.replace(/-/g, "");
      if (
        compactStem.length >= 4 &&
        !finalHost.replace(/\./g, "").includes(compactStem)
      ) {
        continue;
      }

      const html = await res.text();
      const title =
        html.match(/<title[^>]*>([^<]+)/i)?.[1]?.toLowerCase() ?? "";
      const haystack = `${title} ${finalHost} ${finalUrl}`.toLowerCase();
      const tokens = normalizeName(festivalName)
        .split(" ")
        .filter((t) => t.length > 2);
      const tokenHits = tokens.filter((t) => haystack.includes(t));
      if (tokenHits.length === 0) continue;

      const festive =
        /fest|festival|music|carnival|fringe|parade|concert|comedy|film|food|beer|jazz|folk|rock|live\b|event|calling|carnival/.test(
          haystack,
        );
      // Strong host/title name match can stand in for a missing "festival" keyword.
      if (!festive && tokenHits.length < 2) continue;

      return officialWebsite(finalUrl) || finalUrl;
    } catch {
      // try next scheme / host
    }
  }
  return null;
}

async function websiteFromDomainGuess(
  festivalName: string,
): Promise<string | null> {
  for (const host of domainGuesses(festivalName).slice(0, 20)) {
    const hit = await probeHost(host, festivalName);
    if (hit) return hit;
  }
  return null;
}

const source = await readFile(generatedPath, "utf8");
const festivals = extractFestivalsArray(source);

console.log("Fetching UK festival websites from Wikidata…");
const catalog = await fetchUkFestivalWebsites();
console.log(`Wikidata catalog size: ${catalog.size}`);

let kept = 0;
let fromWiki = 0;
let fromListing = 0;
let fromGuess = 0;
let unresolved = 0;

for (const festival of festivals) {
  const existing = officialWebsite(festival.website);
  if (existing) {
    festival.website = existing;
    kept++;
    continue;
  }

  festival.website = "";

  const wiki = catalog.get(normalizeName(festival.name));
  if (wiki) {
    festival.website = wiki;
    fromWiki++;
    console.log(`wiki  ${festival.name} → ${wiki}`);
    continue;
  }

  if (festival.listingUrl) {
    const fromPage = await websiteFromListing(
      festival.listingUrl,
      festival.name,
    );
    await sleep(250);
    if (fromPage) {
      festival.website = fromPage;
      fromListing++;
      console.log(`list  ${festival.name} → ${fromPage}`);
      continue;
    }
  }

  const guessed = await websiteFromDomainGuess(festival.name);
  if (guessed) {
    festival.website = guessed;
    fromGuess++;
    console.log(`guess ${festival.name} → ${guessed}`);
    continue;
  }

  unresolved++;
  console.log(`miss  ${festival.name}`);
}

const attribution =
  "TripSapien public festival calendar (CC BY 4.0) https://github.com/forrestmill-cmd/tripsapien-public-data";

await writeFile(
  generatedPath,
  `/* eslint-disable */
/**
 * Auto-generated by scripts/import-uk-festivals.mts — do not edit by hand.
 * Official websites enriched by scripts/enrich-festival-websites.mts
 * (Wikidata → listing page → domain guess).
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
  listingUrl: string;
  source: "tripsapien";
  category: string;
};

export const generatedUkFestivals: GeneratedFestival[] = ${JSON.stringify(
    festivals.map((f) => ({
      ...f,
      listingUrl: f.listingUrl ?? "",
    })),
    null,
    2,
  )};
`,
);

const withSite = festivals.filter((f) => f.website).length;
const stillAgg = festivals.filter((f) => isAggregatorWebsite(f.website)).length;
const stillNoise = festivals.filter((f) => isNoiseWebsite(f.website)).length;

console.log(
  `\nDone. kept=${kept} wiki=${fromWiki} listing=${fromListing} guess=${fromGuess} miss=${unresolved}. ` +
    `with website=${withSite}/${festivals.length} aggregator=${stillAgg} noise=${stillNoise}`,
);
