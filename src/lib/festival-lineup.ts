import { unstable_cache } from "next/cache";
import { officialWebsite } from "@/data/festival-websites";

const UA =
  "Mozilla/5.0 (compatible; DrizzleLive/1.0; +https://drizzle.live; lineup discovery)";

const LINEUP_PATHS = [
  "/lineup",
  "/line-up",
  "/artists",
  "/acts",
  "/the-lineup",
  "/artist-lineup",
  "/2026-lineup",
  "/lineup-2026",
];

export type FestivalEventLink = {
  href: string;
  label: "Line-up" | "Festival site";
};

function samePage(a: string, b: string): boolean {
  try {
    const left = new URL(a);
    const right = new URL(b);
    const norm = (u: URL) =>
      `${u.origin}${u.pathname.replace(/\/$/, "")}`.toLowerCase();
    return norm(left) === norm(right);
  } catch {
    return a === b;
  }
}

function looksLikeLineup(url: string, text = ""): boolean {
  const hay = `${url} ${text}`.toLowerCase();
  return /line[\s_-]?up|artists?(?:\b|\/)|\/acts\b|\blineup\b/.test(hay);
}

async function fetchText(url: string): Promise<{ url: string; text: string } | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (/<title[^>]*>[^<]*(404|not found|page not found)/i.test(text)) {
      return null;
    }
    return { url: res.url || url, text };
  } catch {
    return null;
  }
}

function extractLineupFromHtml(baseUrl: string, html: string): string | null {
  const matches = html.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  );
  let best: string | null = null;
  for (const match of matches) {
    const href = match[1]?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    const text = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
    if (!looksLikeLineup(href, text)) continue;
    try {
      const absolute = new URL(href, baseUrl).toString();
      if (officialWebsite(absolute) || absolute.startsWith(new URL(baseUrl).origin)) {
        // Prefer explicit "lineup" wording over generic "artists"
        if (/line[\s_-]?up/i.test(href + text)) return absolute;
        best ??= absolute;
      }
    } catch {
      // ignore bad URLs
    }
  }
  return best;
}

async function discoverLineupUrl(website: string): Promise<string | null> {
  const base = websiteFromDatabase(website);
  if (!base) return null;

  const home = await fetchText(base);
  if (home) {
    const fromHome = extractLineupFromHtml(home.url, home.text);
    if (fromHome && !samePage(fromHome, base)) return fromHome;
  }

  for (const path of LINEUP_PATHS) {
    const candidate = new URL(path, base).toString();
    const page = await fetchText(candidate);
    if (!page) continue;
    if (samePage(page.url, base)) continue;
    if (looksLikeLineup(page.url, page.text.slice(0, 4000))) {
      return page.url;
    }
    // Reachable dedicated path under same host still counts as lineup page
    try {
      if (new URL(page.url).pathname.replace(/\/$/, "") !== "/") {
        return page.url;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function websiteFromDatabase(website: string): string {
  const trimmed = website.trim();
  if (!trimmed) return "";
  // Prefer the stored DB URL; only drop known aggregator / noise hosts.
  return officialWebsite(trimmed) || (isHttpUrl(trimmed) ? trimmed : "");
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function resolveFestivalEventLink(
  website: string,
): Promise<FestivalEventLink | null> {
  const base = websiteFromDatabase(website);
  if (!base) return null;

  const lineup = await discoverLineupUrl(base);
  if (lineup) {
    return { href: lineup, label: "Line-up" };
  }
  return { href: base, label: "Festival site" };
}

/** Cached lineup / festival-site link derived from the DB website URL. */
export function getFestivalEventLink(
  website: string,
): Promise<FestivalEventLink | null> {
  const base = websiteFromDatabase(website);
  if (!base) return Promise.resolve(null);

  const cached = unstable_cache(
    async () => resolveFestivalEventLink(base),
    ["festival-event-link", base],
    { revalidate: 86400, tags: ["festival-event-link"] },
  );

  return cached();
}
