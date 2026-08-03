import { FestivalList } from "@/components/FestivalList";
import type { FestivalListItem } from "@/components/FestivalList";
import { listFestivals } from "@/data/festival-repository";
import {
  getAggregatedForecast,
  getAggregatedWeather,
  summarizeForecast,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const festivals = await listFestivals();

  const weatherResults = await Promise.all(
    festivals.map(async (festival) => {
      const [currentResult, forecastResult] = await Promise.allSettled([
        getAggregatedWeather({ lat: festival.lat, lon: festival.lon }),
        getAggregatedForecast({
          lat: festival.lat,
          lon: festival.lon,
          start: festival.startDate,
          end: festival.endDate,
        }),
      ]);

      const current =
        currentResult.status === "fulfilled"
          ? currentResult.value.consensus.current
          : null;
      const currentMeta =
        currentResult.status === "fulfilled" ? currentResult.value : null;

      const forecast =
        forecastResult.status === "fulfilled"
          ? summarizeForecast(forecastResult.value)
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
    }),
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
      <h1 className="brand">Festcheck</h1>
      <p className="tagline">
        Live conditions and festival-weekend forecasts, blended from multiple
        weather sources.
      </p>
      <FestivalList items={items} />
    </main>
  );
}
