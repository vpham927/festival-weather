import { ConfidenceNote } from "@/components/ConfidenceNote";
import { CurrentWeather } from "@/components/CurrentWeather";
import { FestivalForecast } from "@/components/FestivalForecast";
import { SourceForecastGrid } from "@/components/SourceForecastGrid";
import { getFestivalById } from "@/data/festival-repository";
import { formatDateRange, remainingFestivalDays } from "@/lib/format";
import { getAggregatedForecast, getAggregatedWeather } from "@/lib/weather";
import type { ForecastResponse, WeatherResponse } from "@/lib/weather/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const festival = await getFestivalById(id);
  if (!festival) return { title: "Festival not found" };
  return {
    title: `${festival.name} · Festival Weather`,
    description: `Current weather at ${festival.name} in ${festival.location}.`,
  };
}

export default async function FestivalPage({ params }: Props) {
  const { id } = await params;
  const festival = await getFestivalById(id);
  if (!festival) notFound();

  const [currentResult, forecastResult] = await Promise.allSettled([
    getAggregatedWeather({ lat: festival.lat, lon: festival.lon }),
    getAggregatedForecast({
      lat: festival.lat,
      lon: festival.lon,
      start: festival.startDate,
      end: festival.endDate,
    }),
  ]);

  const weather: WeatherResponse | null =
    currentResult.status === "fulfilled" ? currentResult.value : null;
  const fetchError =
    currentResult.status === "fulfilled"
      ? null
      : "Could not load weather right now. Try again shortly.";

  const forecast: ForecastResponse | null =
    forecastResult.status === "fulfilled" ? forecastResult.value : null;
  const forecastDays = forecast?.consensus.days ?? [];

  return (
    <main className="festival-detail">
      <Link href="/" className="back-link">
        ← All festivals
      </Link>
      <h1 className="festival-hero-name">{festival.name}</h1>
      <p className="festival-hero-meta">
        {formatDateRange(festival.startDate, festival.endDate)}
        <span aria-hidden> · </span>
        {festival.location}
      </p>

      <h2 className="section-label">Consensus now</h2>

      {fetchError ? <p className="weather-error">{fetchError}</p> : null}

      {weather ? (
        <>
          <CurrentWeather current={weather.consensus.current} />
          <ConfidenceNote
            confidence={weather.consensus.confidence}
            sourcesAgree={weather.consensus.sourcesAgree}
            sourcesUsed={weather.consensus.sourcesUsed}
            sourcesFailed={weather.consensus.sourcesFailed}
          />
          {weather.consensus.current ? (
            <p className="packing-hint">{weather.consensus.packingHint}</p>
          ) : null}
        </>
      ) : null}

      {forecast && forecastDays.length > 0 ? (
        <>
          <h2 className="section-label section-label--spaced">
            Forecast for the festival
          </h2>
          <FestivalForecast
            days={forecastDays}
            totalDays={remainingFestivalDays(
              festival.startDate,
              festival.endDate,
            )}
          />
          <ConfidenceNote
            kind="forecast"
            confidence={forecast.consensus.confidence}
            sourcesAgree={forecast.consensus.sourcesAgree}
            sourcesUsed={forecast.consensus.sourcesUsed}
            sourcesFailed={forecast.consensus.sourcesFailed}
          />
        </>
      ) : null}

      {forecast ? (
        <>
          <h2 className="section-label section-label--spaced">By source</h2>
          <SourceForecastGrid
            sources={forecast.sources}
            sourcesFailed={forecast.consensus.sourcesFailed}
            festivalName={festival.name}
            dateRangeLabel={formatDateRange(
              festival.startDate,
              festival.endDate,
            )}
            totalDays={remainingFestivalDays(
              festival.startDate,
              festival.endDate,
            )}
          />
        </>
      ) : null}
    </main>
  );
}
