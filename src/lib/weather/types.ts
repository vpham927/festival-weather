export type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "rain"
  | "heavy_rain"
  | "storm"
  | "snow"
  | "fog"
  | "unknown";

export type CurrentConditions = {
  temp: number;
  feelsLike: number;
  humidity: number;
  precipMm: number;
  windMs: number;
  condition: WeatherCondition;
  observedAt: string;
};

export type WeatherSourceName =
  | "open-meteo"
  | "openweather"
  | "tomorrow"
  | "weatherapi"
  | "google";

export type SourceCurrent = {
  source: WeatherSourceName;
  current: CurrentConditions;
};

export type Confidence = "high" | "medium" | "low";

export type ConsensusCurrent = CurrentConditions & {
  agreement: boolean;
};

export type WeatherConsensus = {
  current: ConsensusCurrent | null;
  confidence: Confidence;
  sourcesUsed: WeatherSourceName[];
  sourcesFailed: WeatherSourceName[];
  sourcesAgree: boolean;
  packingHint: string;
};

export type WeatherResponse = {
  consensus: WeatherConsensus;
  sources: SourceCurrent[];
};

export type DailyForecast = {
  date: string;
  tempHigh: number;
  tempLow: number;
  precipProb: number;
  precipMm: number;
  windMs: number;
  condition: WeatherCondition;
};

export type SourceForecast = {
  source: WeatherSourceName;
  days: DailyForecast[];
};

export type ConsensusDay = DailyForecast & {
  agreement: boolean;
};

export type ForecastConsensus = {
  days: ConsensusDay[];
  confidence: Confidence;
  sourcesUsed: WeatherSourceName[];
  sourcesFailed: WeatherSourceName[];
  sourcesAgree: boolean;
};

export type ForecastResponse = {
  consensus: ForecastConsensus;
  sources: SourceForecast[];
};

/** Compact summary for list UI */
export type ForecastSummary = {
  tempHigh: number;
  tempLow: number;
  condition: WeatherCondition;
  precipProb: number;
  dayCount: number;
  confidence: Confidence;
  sourcesUsed: number;
};
