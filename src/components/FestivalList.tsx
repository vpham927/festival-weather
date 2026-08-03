"use client";

import type { Festival } from "@/data/festivals";
import { FestivalDetailOverlay } from "@/components/FestivalDetailOverlay";
import { NoForecastIcon, WeatherIcon } from "@/components/WeatherIcon";
import { conditionLabel, formatDateRange } from "@/lib/format";
import type {
  Confidence,
  ForecastSummary,
  WeatherCondition,
} from "@/lib/weather/types";
import {
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from "react";

export type FestivalListCurrent = {
  temp: number;
  condition: WeatherCondition;
  confidence: Confidence;
  sourcesUsed: number;
};

export type FestivalListItem = {
  festival: Festival;
  current: FestivalListCurrent | null;
  forecast: ForecastSummary | null;
};

type Props = {
  items: FestivalListItem[];
};

export function FestivalList({ items }: Props) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Festival | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      ({ festival: f }) =>
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="festival-list">
      <label className="search-label" htmlFor="festival-search">
        Search festivals
      </label>
      <input
        id="festival-search"
        type="search"
        className="search-input"
        placeholder="Name or place…"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          startTransition(() => setQuery(value));
        }}
        autoComplete="off"
      />

      {filtered.length === 0 ? (
        <p className="festival-empty">No festivals match that search.</p>
      ) : (
        <ul
          className={`festival-cards ${isPending ? "is-pending" : ""}`}
          aria-live="polite"
        >
          {filtered.map(({ festival: f, current, forecast }, i) => (
            <li
              key={f.id}
              className="festival-card"
              style={
                {
                  "--row-delay": `${Math.min(i, 12) * 55}ms`,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className="festival-card-link"
                onClick={() => setSelected(f)}
              >
                <div className="festival-card-top">
                  <h2 className="festival-name">{f.name}</h2>
                  <p className="festival-meta">
                    <span>{formatDateRange(f.startDate, f.endDate)}</span>
                    <span className="festival-dot" aria-hidden>
                      ·
                    </span>
                    <span>{f.location}</span>
                  </p>
                </div>

                <div className="festival-weather-pair">
                  <div className="festival-weather-slot">
                    <span className="festival-weather-label">Now</span>
                    {current ? (
                      <>
                        <span className="festival-weather-main">
                          <WeatherIcon
                            condition={current.condition}
                            size="md"
                          />
                          <span className="festival-weather-temp">
                            {Math.round(current.temp)}°
                          </span>
                        </span>
                        <span className="festival-weather-condition">
                          {conditionLabel(current.condition)}
                        </span>
                      </>
                    ) : (
                      <span className="festival-weather-condition">
                        Unavailable
                      </span>
                    )}
                  </div>

                  <div
                    className="festival-weather-slot"
                    title={
                      forecast
                        ? `Consensus forecast across ${forecast.dayCount} day${forecast.dayCount === 1 ? "" : "s"} (${forecast.sourcesUsed} sources)`
                        : "No forecast available for these festival dates yet"
                    }
                  >
                    <span className="festival-weather-label">Forecast</span>
                    {forecast ? (
                      <>
                        <span className="festival-weather-main">
                          <WeatherIcon
                            condition={forecast.condition}
                            size="md"
                          />
                          <span className="festival-weather-temp festival-weather-temp--range">
                            {Math.round(forecast.tempHigh)}°
                            <span className="temp-sep">/</span>
                            {Math.round(forecast.tempLow)}°
                          </span>
                        </span>
                        <span className="festival-weather-condition">
                          {conditionLabel(forecast.condition)}
                          {forecast.precipProb >= 35
                            ? ` · ${forecast.precipProb}% rain`
                            : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="festival-weather-main">
                          <NoForecastIcon size="md" />
                        </span>
                        <span className="festival-weather-condition">
                          No forecast
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <FestivalDetailOverlay
          key={selected.id}
          festival={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
