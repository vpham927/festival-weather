import type { CurrentConditions, DailyForecast } from "../types";
import { conditionFromTomorrow } from "../normalize";

type TomorrowResponse = {
  data?: {
    time?: string;
    values?: {
      temperature?: number;
      temperatureApparent?: number;
      humidity?: number;
      precipitationIntensity?: number;
      windSpeed?: number;
      weatherCode?: number;
    };
  };
};

export async function fetchTomorrowCurrent(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    units: "metric",
    apikey: apiKey,
  });

  const res = await fetch(
    `https://api.tomorrow.io/v4/weather/realtime?${params}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`Tomorrow.io ${res.status}`);
  }

  const data = (await res.json()) as TomorrowResponse;
  const values = data.data?.values;
  if (!values) {
    throw new Error("Tomorrow.io returned no current weather");
  }

  return {
    temp: values.temperature ?? 0,
    feelsLike: values.temperatureApparent ?? values.temperature ?? 0,
    humidity: values.humidity ?? 0,
    precipMm: values.precipitationIntensity ?? 0,
    windMs: values.windSpeed ?? 0,
    condition: conditionFromTomorrow(values.weatherCode ?? 0),
    observedAt: data.data?.time
      ? new Date(data.data.time).toISOString()
      : new Date().toISOString(),
  };
}

type TomorrowForecastResponse = {
  timelines?: {
    daily?: {
      time: string;
      values: {
        temperatureMax?: number;
        temperatureMin?: number;
        precipitationProbabilityAvg?: number;
        precipitationProbabilityMax?: number;
        rainAccumulationSum?: number;
        precipitationIntensityAvg?: number;
        windSpeedMax?: number;
        weatherCodeMax?: number;
        weatherCodeMostLikely?: number;
      };
    }[];
  };
};

export async function fetchTomorrowForecast(
  lat: number,
  lon: number,
  start: string,
  end: string,
  apiKey: string,
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    timesteps: "1d",
    units: "metric",
    apikey: apiKey,
  });

  const res = await fetch(
    `https://api.tomorrow.io/v4/weather/forecast?${params}`,
    { next: { revalidate: 1800 } },
  );
  if (!res.ok) {
    throw new Error(`Tomorrow.io forecast ${res.status}`);
  }

  const data = (await res.json()) as TomorrowForecastResponse;
  const daily = data.timelines?.daily ?? [];

  return daily
    .map((d) => {
      const date = d.time.slice(0, 10);
      return {
        date,
        tempHigh: d.values.temperatureMax ?? 0,
        tempLow: d.values.temperatureMin ?? 0,
        precipProb:
          d.values.precipitationProbabilityMax ??
          d.values.precipitationProbabilityAvg ??
          0,
        precipMm:
          d.values.rainAccumulationSum ??
          d.values.precipitationIntensityAvg ??
          0,
        windMs: d.values.windSpeedMax ?? 0,
        condition: conditionFromTomorrow(
          d.values.weatherCodeMostLikely ?? d.values.weatherCodeMax ?? 0,
        ),
      };
    })
    .filter((d) => d.date >= start && d.date <= end);
}
