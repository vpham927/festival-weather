import type { CurrentConditions, DailyForecast } from "../types";
import { conditionFromWeatherApi } from "../normalize";

type WeatherApiResponse = {
  current?: {
    last_updated_epoch?: number;
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    precip_mm: number;
    wind_kph: number;
    condition?: { code?: number };
  };
};

export async function fetchWeatherApiCurrent(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    key: apiKey,
    q: `${lat},${lon}`,
    aqi: "no",
  });

  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?${params}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`WeatherAPI ${res.status}`);
  }

  const data = (await res.json()) as WeatherApiResponse;
  const c = data.current;
  if (!c) {
    throw new Error("WeatherAPI returned no current weather");
  }

  return {
    temp: c.temp_c,
    feelsLike: c.feelslike_c,
    humidity: c.humidity,
    precipMm: c.precip_mm ?? 0,
    windMs: (c.wind_kph ?? 0) / 3.6,
    condition: conditionFromWeatherApi(c.condition?.code ?? 0),
    observedAt: c.last_updated_epoch
      ? new Date(c.last_updated_epoch * 1000).toISOString()
      : new Date().toISOString(),
  };
}

type WeatherApiForecastResponse = {
  forecast?: {
    forecastday?: {
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        daily_chance_of_rain: number;
        totalprecip_mm: number;
        maxwind_kph: number;
        condition?: { code?: number };
      };
    }[];
  };
};

function daysBetween(start: string, end: string): number {
  const a = new Date(start + "T12:00:00Z").getTime();
  const b = new Date(end + "T12:00:00Z").getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export async function fetchWeatherApiForecast(
  lat: number,
  lon: number,
  start: string,
  end: string,
  apiKey: string,
): Promise<DailyForecast[]> {
  const today = new Date().toISOString().slice(0, 10);
  // WeatherAPI free tier: up to 14 days from today
  if (start > today) {
    const ahead =
      (new Date(start + "T12:00:00Z").getTime() -
        new Date(today + "T12:00:00Z").getTime()) /
      86400000;
    if (ahead > 13) return [];
  }

  const span = Math.min(14, daysBetween(today, end));
  const params = new URLSearchParams({
    key: apiKey,
    q: `${lat},${lon}`,
    days: String(span),
    aqi: "no",
    alerts: "no",
  });

  const res = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?${params}`,
    { next: { revalidate: 1800 } },
  );
  if (!res.ok) {
    throw new Error(`WeatherAPI forecast ${res.status}`);
  }

  const data = (await res.json()) as WeatherApiForecastResponse;
  return (data.forecast?.forecastday ?? [])
    .filter((d) => d.date >= start && d.date <= end)
    .map((d) => ({
      date: d.date,
      tempHigh: d.day.maxtemp_c,
      tempLow: d.day.mintemp_c,
      precipProb: d.day.daily_chance_of_rain ?? 0,
      precipMm: d.day.totalprecip_mm ?? 0,
      windMs: (d.day.maxwind_kph ?? 0) / 3.6,
      condition: conditionFromWeatherApi(d.day.condition?.code ?? 0),
    }));
}
