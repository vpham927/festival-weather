/** Listing / directory sites that are not the festival's own homepage. */
const AGGREGATOR_HOSTS = new Set([
  "www.musicfestivalwizard.com",
  "musicfestivalwizard.com",
  "festagent.com",
  "www.festagent.com",
  "www.festivalfinder.eu",
  "festivalfinder.eu",
  "en.wikipedia.org",
  "wikipedia.org",
  "artguide.artforum.com",
  "www.artforum.com",
  "artforum.com",
]);

/** Social / ticket / news hosts — fine for reading, not festival brand icons. */
const NOISE_HOST_SNIPPETS = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "linkedin.com",
  "reddit.com",
  "ticketmaster.",
  "skiddle.com",
  "dice.fm",
  "songkick.com",
  "bandsintown.com",
  "glartent.com",
  "timeout.com",
  "theguardian.com",
  "bbc.co.uk",
  "bbc.com",
  "google.com",
  "maps.google.",
  "apple.com",
  "spotify.com",
  "soundcloud.com",
  "eventbrite.",
  "seetickets.",
  "gigantic.com",
  "ents24.com",
  "tripadvisor.",
  "booking.com",
  "airbnb.",
  "filmfestivallife.com",
  "filmfreeway.com",
  "cookiepedia.",
  "paperspast.",
  "natlib.govt.nz",
  "wikipedia.org",
  "wikidata.org",
  "blogspot.",
  "wordpress.com",
  "linktr.ee",
  "bit.ly",
  "t.co",
];

export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function isAggregatorWebsite(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (AGGREGATOR_HOSTS.has(host)) return true;
    if (host.endsWith("wikipedia.org")) return true;
    if (host.includes("musicfestivalwizard")) return true;
    if (host.includes("festagent.")) return true;
    if (host.includes("festivalfinder.")) return true;
    return false;
  } catch {
    return false;
  }
}

export function isNoiseWebsite(url: string): boolean {
  if (!url.trim()) return false;
  if (isAggregatorWebsite(url)) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return NOISE_HOST_SNIPPETS.some((snippet) => {
      const needle = snippet.toLowerCase();
      // Exact host or subdomain / suffix match — avoid "t.co" matching "*.co.uk".
      if (needle.startsWith(".")) {
        return host.endsWith(needle) || host.includes(needle);
      }
      if (needle.endsWith(".")) {
        return host === needle.slice(0, -1) || host.startsWith(needle);
      }
      return (
        host === needle ||
        host.endsWith(`.${needle}`) ||
        host.includes(`.${needle}`)
      );
    });
  } catch {
    return true;
  }
}

/** Keep only real festival (or other non-aggregator) URLs. */
export function officialWebsite(url: string): string {
  if (!url.trim()) return "";
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("Special:Search")) return "";
    if (isAggregatorWebsite(url)) return "";
    if (isNoiseWebsite(url)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}
