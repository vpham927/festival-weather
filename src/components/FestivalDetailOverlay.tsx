"use client";

import { ConfidenceNote } from "@/components/ConfidenceNote";
import { CurrentWeather } from "@/components/CurrentWeather";
import { FestivalEventLink } from "@/components/FestivalEventLink";
import { FestivalFavicon } from "@/components/FestivalFavicon";
import { FestivalForecast } from "@/components/FestivalForecast";
import { SourceForecastGrid } from "@/components/SourceForecastGrid";
import { WeatherIcon } from "@/components/WeatherIcon";
import type { Festival } from "@/data/festivals";
import {
  festivalDisplayName,
  formatDateRange,
  remainingFestivalDays,
} from "@/lib/format";
import type {
  ForecastResponse,
  WeatherResponse,
} from "@/lib/weather/types";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DetailPayload = {
  weather: WeatherResponse | null;
  forecast: ForecastResponse | null;
};

type Props = {
  festival: Festival;
  onClose: () => void;
};

export function FestivalDetailOverlay({ festival, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<DetailPayload | null>(null);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  });

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(festival.lat),
      lon: String(festival.lon),
      start: festival.startDate,
      end: festival.endDate,
    });

    fetch(`/api/weather?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load weather right now.");
        return res.json() as Promise<DetailPayload & { error?: string }>;
      })
      .then((data) => {
        if (data.error && !data.weather && !data.forecast) {
          throw new Error(data.error);
        }
        setPayload({
          weather: data.weather ?? null,
          forecast: data.forecast ?? null,
        });
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load weather right now.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [festival]);

  const weather = payload?.weather ?? null;
  const forecast = payload?.forecast ?? null;
  const forecastDays = forecast?.consensus.days ?? [];
  const backdropCondition = weather?.consensus.current?.condition ?? "clear";

  return createPortal(
    <div
      className="festival-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="festival-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="festival-overlay-weather-bg" aria-hidden>
          <WeatherIcon
            condition={backdropCondition}
            size="lg"
            className="festival-overlay-weather-icon"
          />
        </div>

        <header className="festival-overlay-header">
          <div>
            <h2
              id={titleId}
              className="festival-hero-name festival-overlay-title"
            >
              <FestivalFavicon
                iconUrl={festival.iconUrl}
                website={festival.website}
                name={festivalDisplayName(festival.name)}
                size="md"
              />
              <span>{festivalDisplayName(festival.name)}</span>
            </h2>
            <p className="festival-hero-meta festival-overlay-meta">
              {formatDateRange(festival.startDate, festival.endDate)}
              <span aria-hidden> · </span>
              {festival.location}
              {festival.website ? (
                <>
                  <span aria-hidden> · </span>
                  <FestivalEventLink
                    festivalId={festival.id}
                    website={festival.website}
                  />
                </>
              ) : null}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="festival-overlay-close"
            onClick={onClose}
            aria-label="Close festival details"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="festival-overlay-body">
          {loading ? (
            <p className="festival-overlay-status">Loading weather…</p>
          ) : null}

          {error ? <p className="weather-error">{error}</p> : null}

          {!loading && weather ? (
            <>
              <CurrentWeather current={weather.consensus.current} />
              <ConfidenceNote
                confidence={weather.consensus.confidence}
                sourcesAgree={weather.consensus.sourcesAgree}
                sourcesUsed={weather.consensus.sourcesUsed}
                sourcesFailed={weather.consensus.sourcesFailed}
              />
              {weather.consensus.current ? (
                <p className="packing-hint">{weather.consensus.packingHint}</p>
              ) : null}
            </>
          ) : null}

          {!loading && forecast && forecastDays.length > 0 ? (
            <>
              <h3 className="section-label section-label--spaced">
                Forecast for the festival
              </h3>
              <FestivalForecast
                days={forecastDays}
                totalDays={remainingFestivalDays(
                  festival.startDate,
                  festival.endDate,
                )}
              />
              <ConfidenceNote
                kind="forecast"
                confidence={forecast.consensus.confidence}
                sourcesAgree={forecast.consensus.sourcesAgree}
                sourcesUsed={forecast.consensus.sourcesUsed}
                sourcesFailed={forecast.consensus.sourcesFailed}
              />
            </>
          ) : null}

          {!loading && forecast ? (
            <>
              <h3 className="section-label section-label--spaced">By source</h3>
              <SourceForecastGrid
                sources={forecast.sources}
                sourcesFailed={forecast.consensus.sourcesFailed}
                festivalName={festivalDisplayName(festival.name)}
                dateRangeLabel={formatDateRange(
                  festival.startDate,
                  festival.endDate,
                )}
                totalDays={remainingFestivalDays(
                  festival.startDate,
                  festival.endDate,
                )}
              />
            </>
          ) : null}

          {!loading && !error && !weather && !forecast ? (
            <p className="forecast-empty">
              No weather detail available for this festival right now.
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
