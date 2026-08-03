import type { CurrentConditions, DailyForecast } from "../types";
import { conditionFromOpenWeather } from "../normalize";

type OwmCurrentResponse = {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: { main: string }[];
  wind: { speed: number };
  rain?: { "1h"?: number; "3h"?: number };
  snow?: { "1h"?: number; "3h"?: number };
};

export async function fetchOpenWeatherCurrent(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: "metric",
    appid: apiKey,
  });

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${params}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`OpenWeather ${res.status}`);
  }

  const data = (await res.json()) as OwmCurrentResponse;
  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    precipMm: data.rain?.["1h"] ?? data.rain?.["3h"] ?? data.snow?.["1h"] ?? data.snow?.["3h"] ?? 0,
    windMs: data.wind?.speed ?? 0,
    condition: conditionFromOpenWeather(data.weather?.[0]?.main ?? ""),
    observedAt: new Date(data.dt * 1000).toISOString(),
  };
}

export async function fetchOpenWeatherForecast(
  lat: number,
  lon: number,
  start: string,
  end: string,
  apiKey: string,
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: "metric",
    appid: apiKey,
  });

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?${params}`,
    { next: { revalidate: 1800 } },
  );
  if (!res.ok) {
    throw new Error(`OpenWeather forecast ${res.status}`);
  }

  type Item = {
    dt_txt: string;
    main: { temp_max: number; temp_min: number };
    pop: number;
    rain?: { "3h"?: number };
    snow?: { "3h"?: number };
    wind: { speed: number };
    weather: { main: string }[];
  };

  const data = (await res.json()) as { list: Item[] };
  const byDate = new Map<
    string,
    {
      highs: number[];
      lows: number[];
      pops: number[];
      precip: number;
      winds: number[];
      conditions: string[];
    }
  >();

  for (const item of data.list ?? []) {
    const date = item.dt_txt.slice(0, 10);
    if (date < start || date > end) continue;
    const bucket = byDate.get(date) ?? {
      highs: [],
      lows: [],
      pops: [],
      precip: 0,
      winds: [],
      conditions: [],
    };
    bucket.highs.push(item.main.temp_max);
    bucket.lows.push(item.main.temp_min);
    bucket.pops.push((item.pop ?? 0) * 100);
    bucket.precip += item.rain?.["3h"] ?? item.snow?.["3h"] ?? 0;
    bucket.winds.push(item.wind.speed);
    bucket.conditions.push(item.weather?.[0]?.main ?? "");
    byDate.set(date, bucket);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      tempHigh: Math.max(...b.highs),
      tempLow: Math.min(...b.lows),
      precipProb: Math.round(
        b.pops.reduce((a, c) => a + c, 0) / Math.max(b.pops.length, 1),
      ),
      precipMm: b.precip,
      windMs: Math.max(...b.winds),
      condition: conditionFromOpenWeather(b.conditions[0] ?? ""),
    }));
}
