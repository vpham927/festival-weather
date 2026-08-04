"use client";

import { FestivalForecast } from "@/components/FestivalForecast";
import { WeatherIcon } from "@/components/WeatherIcon";
import { conditionLabel } from "@/lib/format";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/lib/weather/labels";
import { majorityCondition, median, round1 } from "@/lib/weather/normalize";
import type {
  DailyForecast,
  SourceForecast,
  WeatherSourceName,
} from "@/lib/weather/types";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  sources: SourceForecast[];
  sourcesFailed: WeatherSourceName[];
  festivalName: string;
  dateRangeLabel: string;
  totalDays?: number;
};

type SourceSummary = {
  tempHigh: number;
  tempLow: number;
  condition: DailyForecast["condition"];
  precipProb: number;
  dayCount: number;
};

function summarizeDays(days: DailyForecast[]): SourceSummary | null {
  if (days.length === 0) return null;
  return {
    tempHigh: round1(Math.max(...days.map((d) => d.tempHigh))),
    tempLow: round1(Math.min(...days.map((d) => d.tempLow))),
    condition: majorityCondition(days.map((d) => d.condition)),
    precipProb: Math.round(median(days.map((d) => d.precipProb))),
    dayCount: days.length,
  };
}

function SourceForecastPanel({
  label,
  summary,
  index,
  onOpen,
}: {
  label: string;
  summary: SourceSummary;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="source-panel source-panel--button"
      style={{ animationDelay: `${120 + index * 90}ms` }}
      onClick={onOpen}
    >
      <header className="source-panel-header">
        <h3 className="source-panel-name">{label}</h3>
        <span className="source-panel-time">
          {summary.dayCount} day{summary.dayCount === 1 ? "" : "s"}
        </span>
      </header>
      <div className="source-panel-body">
        <WeatherIcon condition={summary.condition} size="sm" />
        <div>
          <p className="forecast-temps">
            <span className="temp-high temp-high--sm">
              {Math.round(summary.tempHigh)}°
            </span>
            <span className="temp-low">
              / {Math.round(summary.tempLow)}°
            </span>
          </p>
          <p className="forecast-condition">
            {conditionLabel(summary.condition)}
            {summary.precipProb >= 20 ? ` · ${summary.precipProb}% rain` : ""}
          </p>
        </div>
      </div>
      <p className="source-panel-hint">View day-by-day forecast</p>
    </button>
  );
}

function FailedPanel({
  label,
  index,
}: {
  label: string;
  index: number;
}) {
  return (
    <article
      className="source-panel source-panel--failed"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <header className="source-panel-header">
        <h3 className="source-panel-name">{label}</h3>
      </header>
      <p className="source-failed-msg">
        No festival-date forecast from this source.
      </p>
    </article>
  );
}

function SourceForecastOverlay({
  label,
  festivalName,
  dateRangeLabel,
  days,
  totalDays,
  onClose,
}: {
  label: string;
  festivalName: string;
  dateRangeLabel: string;
  days: DailyForecast[];
  totalDays?: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    }
  });

  useEffect(() => {
    closeRef.current?.focus();
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return createPortal(
    <div
      className="festival-overlay source-forecast-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="festival-overlay-panel source-forecast-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="festival-overlay-header">
          <div>
            <h2 id={titleId} className="source-forecast-title">
              {label}
            </h2>
            <p className="festival-hero-meta festival-overlay-meta">
              {festivalName}
              <span aria-hidden> · </span>
              {dateRangeLabel}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="festival-overlay-close"
            onClick={onClose}
            aria-label={`Close ${label} forecast`}
          >
            <span aria-hidden>×</span>
          </button>
        </header>
        <div className="festival-overlay-body">
          <h3 className="section-label">Forecast for the festival</h3>
          <FestivalForecast days={days} totalDays={totalDays} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function SourceForecastGrid({
  sources,
  sourcesFailed,
  festivalName,
  dateRangeLabel,
  totalDays,
}: Props) {
  const [selected, setSelected] = useState<WeatherSourceName | null>(null);
  const bySource = new Map(sources.map((s) => [s.source, s.days]));
  const failed = new Set(sourcesFailed);

  const entries = SOURCE_ORDER.filter(
    (name) => bySource.has(name) || failed.has(name),
  );

  if (entries.length === 0) {
    return (
      <p className="forecast-empty">
        No individual source forecasts available for these dates.
      </p>
    );
  }

  const selectedDays = selected ? bySource.get(selected) : undefined;

  return (
    <>
      <div className="source-grid" role="list">
        {entries.map((name, i) => {
          const days = bySource.get(name);
          const label = SOURCE_LABELS[name];
          const summary = days ? summarizeDays(days) : null;

          if (summary) {
            return (
              <div key={name} role="listitem">
                <SourceForecastPanel
                  label={label}
                  summary={summary}
                  index={i}
                  onOpen={() => setSelected(name)}
                />
              </div>
            );
          }

          return (
            <div key={name} role="listitem">
              <FailedPanel label={label} index={i} />
            </div>
          );
        })}
      </div>

      {selected && selectedDays ? (
        <SourceForecastOverlay
          label={SOURCE_LABELS[selected]}
          festivalName={festivalName}
          dateRangeLabel={dateRangeLabel}
          days={selectedDays}
          totalDays={totalDays}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
