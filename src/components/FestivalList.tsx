"use client";

import type { Festival } from "@/data/festivals";
import {
  DEFAULT_FESTIVAL_CATEGORY,
  FESTIVAL_CATEGORIES,
  FESTIVAL_CATEGORY_LABELS,
  type FestivalCategory,
} from "@/data/festival-categories";
import {
  DEFAULT_FESTIVAL_LIST_RANGE,
  type FestivalListRange,
} from "@/data/festival-range";
import { FestivalDetailOverlay } from "@/components/FestivalDetailOverlay";
import { FestivalFavicon } from "@/components/FestivalFavicon";
import { FestivalPinButton } from "@/components/FestivalPinButton";
import { NoForecastIcon, WeatherIcon } from "@/components/WeatherIcon";
import { usePinnedFestivalsReady } from "@/hooks/usePinnedFestivals";
import { conditionLabel, festivalDisplayName, formatDateRange } from "@/lib/format";
import type {
  Confidence,
  ForecastSummary,
  WeatherCondition,
} from "@/lib/weather/types";
import Link from "next/link";
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
  category: FestivalCategory;
  range: FestivalListRange;
};

function homeHref(category: FestivalCategory, range: FestivalListRange): string {
  const params = new URLSearchParams();
  if (category !== DEFAULT_FESTIVAL_CATEGORY) {
    params.set("category", category);
  }
  if (range !== DEFAULT_FESTIVAL_LIST_RANGE) {
    params.set("range", range);
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function FestivalList({ items, category, range }: Props) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Festival | null>(null);
  const { pinnedIds, isPinned, togglePin, ready } = usePinnedFestivalsReady();
  const showAllHref = homeHref(category, "all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = !q
      ? items
      : items.filter(
          ({ festival: f }) =>
            f.name.toLowerCase().includes(q) ||
            f.location.toLowerCase().includes(q),
        );

    if (!ready || pinnedIds.length === 0) return matched;

    const pinIndex = new Map(pinnedIds.map((id, i) => [id, i]));
    return [...matched].sort((a, b) => {
      const aPin = pinIndex.has(a.festival.id);
      const bPin = pinIndex.has(b.festival.id);
      if (aPin && bPin) {
        return (
          (pinIndex.get(a.festival.id) ?? 0) -
          (pinIndex.get(b.festival.id) ?? 0)
        );
      }
      if (aPin !== bPin) return aPin ? -1 : 1;
      return 0; // keep server popular / date order
    });
  }, [items, query, pinnedIds, ready]);

  return (
    <div className="festival-list">
      <div className="list-toolbar">
        <div
          className="category-pills"
          role="tablist"
          aria-label="Festival category"
        >
          {FESTIVAL_CATEGORIES.map((value) => {
            const selectedCategory = value === category;
            return (
              <Link
                key={value}
                href={homeHref(value, range)}
                role="tab"
                aria-selected={selectedCategory}
                className={`category-pill${selectedCategory ? " is-active" : ""}`}
                scroll={false}
              >
                {FESTIVAL_CATEGORY_LABELS[value]}
              </Link>
            );
          })}
        </div>

        <div className="range-toggle" role="group" aria-label="Date range">
          <Link
            href={homeHref(category, "week")}
            className={`range-toggle-link${range === "week" ? " is-active" : ""}`}
            aria-current={range === "week" ? "page" : undefined}
            scroll={false}
          >
            This week
          </Link>
          <Link
            href={showAllHref}
            className={`range-toggle-link${range === "all" ? " is-active" : ""}`}
            aria-current={range === "all" ? "page" : undefined}
            scroll={false}
          >
            Show all
          </Link>
        </div>
      </div>

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
        <p className="festival-empty">
          {query.trim() ? (
            "No festivals match that search."
          ) : range === "week" ? (
            <>
              No festivals on this week.{" "}
              <Link href={showAllHref} className="festival-empty-link">
                Show all upcoming
              </Link>
            </>
          ) : (
            "No festivals in this category."
          )}
        </p>
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
              <FestivalPinButton
                festivalId={f.id}
                festivalName={festivalDisplayName(f.name)}
                pinned={ready && isPinned(f.id)}
                onToggle={togglePin}
              />
              <button
                type="button"
                className="festival-card-link"
                onClick={() => setSelected(f)}
              >
                <div className="festival-card-top">
                  <h2 className="festival-name">
                    <FestivalFavicon
                      iconUrl={f.iconUrl}
                      website={f.website}
                      name={festivalDisplayName(f.name)}
                    />
                    <span>{festivalDisplayName(f.name)}</span>
                  </h2>
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
