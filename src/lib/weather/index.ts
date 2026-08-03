import { withCache } from "./cache";
import { buildConsensus, buildForecastConsensus } from "./consensus";
import { majorityCondition, mean, median, round1 } from "./normalize";
import { fetchGoogleCurrent, fetchGoogleForecast } from "./providers/google";
import { fetchOpenMeteoCurrent, fetchOpenMeteoForecast } from "./providers/open-meteo";
import {
  fetchOpenWeatherCurrent,
  fetchOpenWeatherForecast,
} from "./providers/openweather";
import {
  fetchTomorrowCurrent,
  fetchTomorrowForecast,
} from "./providers/tomorrow";
import {
  fetchWeatherApiCurrent,
  fetchWeatherApiForecast,
} from "./providers/weatherapi";
import type {
  CurrentConditions,
  DailyForecast,
  ForecastResponse,
  ForecastSummary,
  WeatherResponse,
  WeatherSourceName,
} from "./types";

export type WeatherQuery = {
  lat: number;
  lon: number;
};

export type ForecastQuery = {
  lat: number;
  lon: number;
  start: string;
  end: string;
};

/** Providers publish daily forecasts roughly two weeks out; beyond that there is nothing to fetch. */
const FORECAST_HORIZON_DAYS = 16;

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function emptyForecastResponse(): ForecastResponse {
  return {
    consensus: {
      days: [],
      confidence: "low",
      sourcesUsed: [],
      sourcesFailed: [],
      sourcesAgree: true,
    },
    sources: [],
  };
}

function envKeys() {
  return {
    owmKey: process.env.OPENWEATHER_API_KEY?.trim(),
    tomorrowKey: process.env.TOMORROW_API_KEY?.trim(),
    weatherApiKey: process.env.WEATHERAPI_API_KEY?.trim(),
    googleKey: process.env.GOOGLE_WEATHER_API_KEY?.trim(),
  };
}

export async function getAggregatedWeather(
  query: WeatherQuery,
): Promise<WeatherResponse> {
  const { lat, lon } = query;
  const key = `current:${lat.toFixed(4)},${lon.toFixed(4)}`;

  return withCache(key, async () => {
    const { owmKey, tomorrowKey, weatherApiKey, googleKey } = envKeys();

    const jobs: {
      source: WeatherSourceName;
      run: () => Promise<CurrentConditions>;
    }[] = [
      {
        source: "open-meteo",
        run: () => fetchOpenMeteoCurrent(lat, lon),
      },
    ];

    if (owmKey) {
      jobs.push({
        source: "openweather",
        run: () => fetchOpenWeatherCurrent(lat, lon, owmKey),
      });
    }

    if (tomorrowKey) {
      jobs.push({
        source: "tomorrow",
        run: () => fetchTomorrowCurrent(lat, lon, tomorrowKey),
      });
    }

    if (weatherApiKey) {
      jobs.push({
        source: "weatherapi",
        run: () => fetchWeatherApiCurrent(lat, lon, weatherApiKey),
      });
    }

    if (googleKey) {
      jobs.push({
        source: "google",
        run: () => fetchGoogleCurrent(lat, lon, googleKey),
      });
    }

    const settled = await Promise.allSettled(jobs.map((j) => j.run()));

    const results = settled.map((result, i) => {
      const source = jobs[i].source;
      if (result.status === "fulfilled") {
        return { source, current: result.value };
      }
      console.error(`[weather] ${source} failed:`, result.reason);
      return { source, error: result.reason };
    });

    return buildConsensus(results);
  });
}

export async function getAggregatedForecast(
  query: ForecastQuery,
): Promise<ForecastResponse> {
  const { lat, lon, start, end } = query;
  const key = `forecast:${lat.toFixed(4)},${lon.toFixed(4)}:${start}:${end}`;

  return withCache(key, async () => {
    const { owmKey, tomorrowKey, weatherApiKey, googleKey } = envKeys();

    const today = new Date().toISOString().slice(0, 10);
    const horizon = addDays(today, FORECAST_HORIZON_DAYS);
    const clampedStart = start < today ? today : start;
    const clampedEnd = end > horizon ? horizon : end;
    if (clampedStart > clampedEnd) {
      return emptyForecastResponse();
    }

    const jobs: {
      source: WeatherSourceName;
      run: () => Promise<DailyForecast[]>;
    }[] = [
      {
        source: "open-meteo",
        run: () => fetchOpenMeteoForecast(lat, lon, clampedStart, clampedEnd),
      },
    ];

    if (owmKey) {
      jobs.push({
        source: "openweather",
        run: () =>
          fetchOpenWeatherForecast(lat, lon, clampedStart, clampedEnd, owmKey),
      });
    }

    if (tomorrowKey) {
      jobs.push({
        source: "tomorrow",
        run: () =>
          fetchTomorrowForecast(
            lat,
            lon,
            clampedStart,
            clampedEnd,
            tomorrowKey,
          ),
      });
    }

    if (weatherApiKey) {
      jobs.push({
        source: "weatherapi",
        run: () =>
          fetchWeatherApiForecast(
            lat,
            lon,
            clampedStart,
            clampedEnd,
            weatherApiKey,
          ),
      });
    }

    if (googleKey) {
      jobs.push({
        source: "google",
        run: () =>
          fetchGoogleForecast(lat, lon, clampedStart, clampedEnd, googleKey),
      });
    }

    const settled = await Promise.allSettled(jobs.map((j) => j.run()));

    const results = settled.map((result, i) => {
      const source = jobs[i].source;
      if (result.status === "fulfilled") {
        return { source, days: result.value };
      }
      console.error(`[forecast] ${source} failed:`, result.reason);
      return { source, error: result.reason };
    });

    return buildForecastConsensus(results);
  });
}

export function summarizeForecast(
  forecast: ForecastResponse,
): ForecastSummary | null {
  const days = forecast.consensus.days;
  if (days.length === 0) return null;

  return {
    tempHigh: round1(mean(days.map((d) => d.tempHigh))),
    tempLow: round1(mean(days.map((d) => d.tempLow))),
    condition: majorityCondition(days.map((d) => d.condition)),
    precipProb: Math.round(median(days.map((d) => d.precipProb))),
    dayCount: days.length,
    confidence: forecast.consensus.confidence,
    sourcesUsed: forecast.consensus.sourcesUsed.length,
  };
}
