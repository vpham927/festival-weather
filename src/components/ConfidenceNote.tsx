import { SOURCE_LABELS } from "@/lib/weather/labels";
import type { Confidence, WeatherSourceName } from "@/lib/weather/types";

type Props = {
  confidence: Confidence;
  sourcesAgree: boolean;
  sourcesUsed: WeatherSourceName[];
  sourcesFailed: WeatherSourceName[];
  /** Forecast gaps usually mean a provider doesn't reach these dates, not a failure. */
  kind?: "current" | "forecast";
};

export function ConfidenceNote({
  confidence,
  sourcesAgree,
  sourcesUsed,
  sourcesFailed,
  kind = "current",
}: Props) {
  const used = sourcesUsed.map((s) => SOURCE_LABELS[s]).join(", ");
  const forecast = kind === "forecast";
  let message: string;

  if (sourcesUsed.length === 0) {
    message = forecast
      ? "No sources publish a forecast for these dates yet."
      : "No weather sources responded.";
  } else if (sourcesUsed.length === 1) {
    message = forecast
      ? `Based on ${used} only — confidence is ${confidence}. The other sources don't forecast this far ahead.`
      : `Based on ${used} only — confidence is ${confidence}. Add more API keys for a stronger consensus.`;
  } else if (sourcesAgree) {
    message = `Sources agree (${used}). Confidence: ${confidence}.`;
  } else {
    message = `Sources differ slightly (${used}). Showing a blended consensus — confidence: ${confidence}.`;
  }

  if (sourcesFailed.length > 0) {
    const labels = sourcesFailed.map((s) => SOURCE_LABELS[s]).join(", ");
    message += forecast
      ? ` No coverage for these dates: ${labels}.`
      : ` Unavailable: ${labels}.`;
  }

  return <p className="confidence-note">{message}</p>;
}
