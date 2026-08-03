import type { CurrentConditions, DailyForecast } from "../types";
import { conditionFromGoogle } from "../normalize";

type GoogleQuantity = {
  degrees?: number;
  quantity?: number;
  value?: number;
  unit?: string;
};

type GoogleCondition = {
  type?: string;
  description?: { text?: string };
};

type GoogleCurrentResponse = {
  currentTime?: string;
  weatherCondition?: GoogleCondition;
  temperature?: GoogleQuantity;
  feelsLikeTemperature?: GoogleQuantity;
  relativeHumidity?: number;
  precipitation?: {
    qpf?: GoogleQuantity;
  };
  wind?: {
    speed?: GoogleQuantity;
  };
};

type GoogleForecastDay = {
  displayDate?: { year?: number; month?: number; day?: number };
  maxTemperature?: GoogleQuantity;
  minTemperature?: GoogleQuantity;
  daytimeForecast?: {
    weatherCondition?: GoogleCondition;
    precipitation?: {
      probability?: { percent?: number };
      qpf?: GoogleQuantity;
    };
    wind?: { speed?: GoogleQuantity };
    thunderstormProbability?: number;
  };
  nighttimeForecast?: {
    weatherCondition?: GoogleCondition;
    precipitation?: {
      probability?: { percent?: number };
      qpf?: GoogleQuantity;
    };
    wind?: { speed?: GoogleQuantity };
    thunderstormProbability?: number;
  };
};

type GoogleForecastResponse = {
  forecastDays?: GoogleForecastDay[];
  nextPageToken?: string;
};

function kphToMs(kph: number): number {
  return kph / 3.6;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function displayDateToIso(d: {
  year?: number;
  month?: number;
  day?: number;
}): string | null {
  if (!d.year || !d.month || !d.day) return null;
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

export async function fetchGoogleCurrent(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<CurrentConditions> {
  const params = new URLSearchParams({
    key: apiKey,
    "location.latitude": String(lat),
    "location.longitude": String(lon),
    unitsSystem: "METRIC",
  });

  const res = await fetch(
    `https://weather.googleapis.com/v1/currentConditions:lookup?${params}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`Google Weather ${res.status}`);
  }

  const data = (await res.json()) as GoogleCurrentResponse;
  if (data.temperature?.degrees === undefined) {
    throw new Error("Google Weather returned no current weather");
  }

  return {
    temp: data.temperature.degrees,
    feelsLike:
      data.feelsLikeTemperature?.degrees ?? data.temperature.degrees,
    humidity: data.relativeHumidity ?? 0,
    precipMm: data.precipitation?.qpf?.quantity ?? 0,
    windMs: kphToMs(data.wind?.speed?.value ?? 0),
    condition: conditionFromGoogle(data.weatherCondition?.type),
    observedAt: data.currentTime
      ? new Date(data.currentTime).toISOString()
      : new Date().toISOString(),
  };
}

export async function fetchGoogleForecast(
  lat: number,
  lon: number,
  start: string,
  end: string,
  apiKey: string,
): Promise<DailyForecast[]> {
  const today = new Date().toISOString().slice(0, 10);
  // Google Weather daily forecast: up to 10 days from today
  if (start > today) {
    const ahead =
      (new Date(`${start}T12:00:00Z`).getTime() -
        new Date(`${today}T12:00:00Z`).getTime()) /
      86_400_000;
    if (ahead > 9) return [];
  }

  const span = Math.min(10, daysBetween(today, end));
  const params = new URLSearchParams({
    key: apiKey,
    "location.latitude": String(lat),
    "location.longitude": String(lon),
    unitsSystem: "METRIC",
    days: String(span),
    pageSize: String(span),
  });

  const days: DailyForecast[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) params.set("pageToken", pageToken);
    else params.delete("pageToken");

    const res = await fetch(
      `https://weather.googleapis.com/v1/forecast/days:lookup?${params}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) {
      throw new Error(`Google Weather forecast ${res.status}`);
    }

    const data = (await res.json()) as GoogleForecastResponse;
    for (const day of data.forecastDays ?? []) {
      const date = displayDateToIso(day.displayDate ?? {});
      if (!date || date < start || date > end) continue;

      const dayPart = day.daytimeForecast;
      const nightPart = day.nighttimeForecast;
      const precipProb = Math.max(
        dayPart?.precipitation?.probability?.percent ?? 0,
        nightPart?.precipitation?.probability?.percent ?? 0,
      );
      const precipMm =
        (dayPart?.precipitation?.qpf?.quantity ?? 0) +
        (nightPart?.precipitation?.qpf?.quantity ?? 0);
      const windKph = Math.max(
        dayPart?.wind?.speed?.value ?? 0,
        nightPart?.wind?.speed?.value ?? 0,
      );
      const conditionType =
        dayPart?.weatherCondition?.type ??
        nightPart?.weatherCondition?.type;

      days.push({
        date,
        tempHigh: day.maxTemperature?.degrees ?? 0,
        tempLow: day.minTemperature?.degrees ?? 0,
        precipProb,
        precipMm,
        windMs: kphToMs(windKph),
        condition: conditionFromGoogle(conditionType),
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return days;
}
