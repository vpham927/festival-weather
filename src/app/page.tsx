import { FestivalList } from "@/components/FestivalList";
import type { FestivalListItem } from "@/components/FestivalList";
import { SiteClock } from "@/components/SiteClock";
import { parseFestivalCategory } from "@/data/festival-categories";
import { listFestivals } from "@/data/festival-repository";
import { mapPool } from "@/lib/map-pool";
import {
  getAggregatedForecast,
  getAggregatedWeather,
  summarizeForecast,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

/** Keep home-page upstream calls gentle — free weather tiers rate-limit hard on Vercel. */
const HOME_WEATHER_CONCURRENCY = 2;

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const category = parseFestivalCategory(params.category);
  const festivals = await listFestivals(undefined, category);

  const weatherResults = await mapPool(
    festivals,
    HOME_WEATHER_CONCURRENCY,
    async (festival) => {
      // Current first, then forecast — halves peak parallel provider calls per festival.
      const currentResult = await Promise.allSettled([
        getAggregatedWeather({ lat: festival.lat, lon: festival.lon }),
      ]);
      const forecastResult = await Promise.allSettled([
        getAggregatedForecast({
          lat: festival.lat,
          lon: festival.lon,
          start: festival.startDate,
          end: festival.endDate,
        }),
      ]);

      const current =
        currentResult[0].status === "fulfilled"
          ? currentResult[0].value.consensus.current
          : null;
      const currentMeta =
        currentResult[0].status === "fulfilled" ? currentResult[0].value : null;

      const forecast =
        forecastResult[0].status === "fulfilled"
          ? summarizeForecast(forecastResult[0].value)
          : null;

      return {
        id: festival.id,
        current: current
          ? {
              temp: current.temp,
              condition: current.condition,
              confidence: currentMeta!.consensus.confidence,
              sourcesUsed: currentMeta!.consensus.sourcesUsed.length,
            }
          : null,
        forecast,
      };
    },
  );

  const byId = Object.fromEntries(weatherResults.map((r) => [r.id, r]));

  const items: FestivalListItem[] = festivals.map((festival) => {
    const row = byId[festival.id];
    return {
      festival,
      current: row?.current ?? null,
      forecast: row?.forecast ?? null,
    };
  });

  return (
    <main>
      <header className="site-header">
        <h1 className="brand">Drizzle.live</h1>
        <SiteClock />
      </header>
      <p className="tagline">
        Live conditions and festival-weekend forecasts, blended from multiple
        weather sources.
      </p>
      <FestivalList items={items} category={category} />
    </main>
  );
}
