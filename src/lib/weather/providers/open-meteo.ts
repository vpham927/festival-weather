import type { CurrentConditions, DailyForecast } from "../types";
import { conditionFromWmo } from "../normalize";

type OpenMeteoResponse = {
  current?: {
    time: string;
    temperature_2m: number | null;
    apparent_temperature: number | null;
    relative_humidity_2m: number | null;
    precipitation: number | null;
    weather_code: number | null;
    wind_speed_10m: number | null;
  };
};

export async function fetchOpenMeteoCurrent(
  lat: number,
  lon: number,
): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    wind_speed_unit: "ms",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const c = data.current;
  if (!c) {
    throw new Error("Open-Meteo returned no current weather");
  }

  return {
    temp: c.temperature_2m ?? 0,
    feelsLike: c.apparent_temperature ?? c.temperature_2m ?? 0,
    humidity: c.relative_humidity_2m ?? 0,
    precipMm: c.precipitation ?? 0,
    windMs: c.wind_speed_10m ?? 0,
    condition: conditionFromWmo(c.weather_code ?? 0),
    observedAt: c.time ? new Date(c.time).toISOString() : new Date().toISOString(),
  };
}

type OpenMeteoDailyResponse = {
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    weather_code: (number | null)[];
  };
};

export async function fetchOpenMeteoForecast(
  lat: number,
  lon: number,
  start: string,
  end: string,
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: start,
    end_date: end,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
      "weather_code",
    ].join(","),
    wind_speed_unit: "ms",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo forecast ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoDailyResponse;
  const daily = data.daily;
  if (!daily?.time?.length) return [];

  return daily.time.map((date, i) => ({
    date,
    tempHigh: daily.temperature_2m_max[i] ?? 0,
    tempLow: daily.temperature_2m_min[i] ?? 0,
    precipProb: daily.precipitation_probability_max[i] ?? 0,
    precipMm: daily.precipitation_sum[i] ?? 0,
    windMs: daily.wind_speed_10m_max[i] ?? 0,
    condition: conditionFromWmo(daily.weather_code[i] ?? 0),
  }));
}
