import { majorityCondition, mean, median, round1 } from "./normalize";
import type {
  Confidence,
  ConsensusCurrent,
  ConsensusDay,
  CurrentConditions,
  DailyForecast,
  ForecastConsensus,
  SourceCurrent,
  SourceForecast,
  WeatherConsensus,
  WeatherSourceName,
} from "./types";

const TEMP_AGREE_BAND = 2.5;
const WIND_AGREE_BAND = 3;
const PRECIP_AGREE_BAND = 25;

function readingsAgree(readings: CurrentConditions[]): boolean {
  if (readings.length < 2) return true;
  const temps = readings.map((r) => r.temp);
  const winds = readings.map((r) => r.windMs);
  const tempSpread = Math.max(...temps) - Math.min(...temps);
  const windSpread = Math.max(...winds) - Math.min(...winds);
  return tempSpread <= TEMP_AGREE_BAND && windSpread <= WIND_AGREE_BAND;
}

function packingHint(current: ConsensusCurrent | null): string {
  if (!current) return "Weather unavailable — try again shortly.";

  const tips: string[] = [];
  if (
    current.condition === "rain" ||
    current.condition === "heavy_rain" ||
    current.condition === "storm" ||
    current.precipMm >= 0.5
  ) {
    tips.push("pack waterproofs");
  }
  if (current.windMs >= 10) tips.push("expect a breezy site");
  if (current.temp <= 8 || current.feelsLike <= 8) {
    tips.push("bring warm layers");
  }
  if (current.temp >= 26) tips.push("plan for sun cover and water");
  if (current.humidity >= 85 && current.temp >= 18) {
    tips.push("it feels muggy out there");
  }

  if (tips.length === 0) {
    return "Conditions look manageable — a versatile festival kit should cover you.";
  }
  return (
    tips
      .map((t, i) => (i === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t))
      .join("; ") + "."
  );
}

function confidenceFor(
  sourceCount: number,
  sourcesAgree: boolean,
): Confidence {
  if (sourceCount >= 3 && sourcesAgree) return "high";
  if (sourceCount >= 2) return sourcesAgree ? "high" : "medium";
  if (sourceCount === 1) return "low";
  return "low";
}

export function buildConsensus(
  results: {
    source: WeatherSourceName;
    current?: CurrentConditions;
    error?: unknown;
  }[],
): { consensus: WeatherConsensus; sources: SourceCurrent[] } {
  const sources: SourceCurrent[] = [];
  const sourcesUsed: WeatherSourceName[] = [];
  const sourcesFailed: WeatherSourceName[] = [];

  for (const r of results) {
    if (r.current) {
      sources.push({ source: r.source, current: r.current });
      sourcesUsed.push(r.source);
    } else {
      sourcesFailed.push(r.source);
    }
  }

  const readings = sources.map((s) => s.current);
  const agreement = readingsAgree(readings);
  const sourcesAgree = sourcesUsed.length < 2 ? true : agreement;

  let current: ConsensusCurrent | null = null;
  if (readings.length > 0) {
    current = {
      temp: round1(mean(readings.map((r) => r.temp))),
      feelsLike: round1(mean(readings.map((r) => r.feelsLike))),
      humidity: Math.round(mean(readings.map((r) => r.humidity))),
      precipMm: round1(mean(readings.map((r) => r.precipMm))),
      windMs: round1(mean(readings.map((r) => r.windMs))),
      condition: majorityCondition(readings.map((r) => r.condition)),
      observedAt: readings
        .map((r) => r.observedAt)
        .sort()
        .at(-1)!,
      agreement,
    };
  }

  const consensus: WeatherConsensus = {
    current,
    confidence: confidenceFor(sourcesUsed.length, sourcesAgree),
    sourcesUsed,
    sourcesFailed,
    sourcesAgree,
    packingHint: packingHint(current),
  };

  return { consensus, sources };
}

function daysByDate(sources: SourceForecast[]): Map<string, DailyForecast[]> {
  const map = new Map<string, DailyForecast[]>();
  for (const src of sources) {
    for (const day of src.days) {
      const list = map.get(day.date) ?? [];
      list.push(day);
      map.set(day.date, list);
    }
  }
  return map;
}

function dayAgrees(readings: DailyForecast[]): boolean {
  if (readings.length < 2) return true;
  const highs = readings.map((r) => r.tempHigh);
  const precip = readings.map((r) => r.precipProb);
  const highSpread = Math.max(...highs) - Math.min(...highs);
  const precipSpread = Math.max(...precip) - Math.min(...precip);
  return highSpread <= TEMP_AGREE_BAND && precipSpread <= PRECIP_AGREE_BAND;
}

export function buildForecastConsensus(
  results: {
    source: WeatherSourceName;
    days?: DailyForecast[];
    error?: unknown;
  }[],
): { consensus: ForecastConsensus; sources: SourceForecast[] } {
  const sources: SourceForecast[] = [];
  const sourcesUsed: WeatherSourceName[] = [];
  const sourcesFailed: WeatherSourceName[] = [];

  for (const r of results) {
    if (r.days && r.days.length > 0) {
      sources.push({ source: r.source, days: r.days });
      sourcesUsed.push(r.source);
    } else {
      sourcesFailed.push(r.source);
    }
  }

  const byDate = daysByDate(sources);
  const dates = [...byDate.keys()].sort();
  const days: ConsensusDay[] = dates.map((date) => {
    const readings = byDate.get(date) ?? [];
    const agreement = dayAgrees(readings);
    return {
      date,
      tempHigh: round1(mean(readings.map((r) => r.tempHigh))),
      tempLow: round1(mean(readings.map((r) => r.tempLow))),
      precipProb: Math.round(median(readings.map((r) => r.precipProb))),
      precipMm: round1(mean(readings.map((r) => r.precipMm))),
      windMs: round1(mean(readings.map((r) => r.windMs))),
      condition: majorityCondition(readings.map((r) => r.condition)),
      agreement,
    };
  });

  const sourcesAgree =
    sourcesUsed.length < 2
      ? true
      : days.length > 0 &&
        days.filter((d) => d.agreement).length >= days.length / 2;

  return {
    consensus: {
      days,
      confidence: confidenceFor(sourcesUsed.length, sourcesAgree),
      sourcesUsed,
      sourcesFailed,
      sourcesAgree,
    },
    sources,
  };
}
