"use client";

import { WeatherIcon } from "@/components/WeatherIcon";
import { conditionLabel } from "@/lib/format";
import type { ConsensusCurrent } from "@/lib/weather/types";

type Props = {
  current: ConsensusCurrent | null;
};

function formatObservedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function CurrentWeather({ current }: Props) {
  if (!current) {
    return (
      <p className="forecast-empty">
        Current weather is unavailable for this location right now.
      </p>
    );
  }

  return (
    <article className="current-weather">
      <p className="current-observed">As of {formatObservedAt(current.observedAt)}</p>
      <div className="current-weather-head">
        <WeatherIcon condition={current.condition} size="lg" />
        <div>
          <p className="forecast-temps">
            <span className="temp-high">{Math.round(current.temp)}°</span>
            <span className="temp-low">
              feels {Math.round(current.feelsLike)}°
            </span>
          </p>
          <p className="forecast-condition">
            {conditionLabel(current.condition)}
          </p>
        </div>
      </div>
      <dl className="current-stats">
        <div>
          <dt>Humidity</dt>
          <dd>{current.humidity}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{current.windMs.toFixed(1)} m/s</dd>
        </div>
        <div>
          <dt>Precip</dt>
          <dd>
            {current.precipMm > 0.05
              ? `${current.precipMm.toFixed(1)} mm`
              : "None"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
