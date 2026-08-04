import { WeatherIcon } from "@/components/WeatherIcon";
import { conditionLabel } from "@/lib/format";
import type { ConsensusDay, DailyForecast } from "@/lib/weather/types";

type Props = {
  days: Array<DailyForecast | ConsensusDay>;
  /** Total nights the festival runs, used to flag partial coverage. */
  totalDays?: number;
};

function weekdayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
  });
}

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function FestivalForecast({ days, totalDays }: Props) {
  if (days.length === 0) return null;

  const highs = days.map((d) => d.tempHigh);
  const lows = days.map((d) => d.tempLow);
  const wettest = days.reduce((a, b) => (b.precipProb > a.precipProb ? b : a));
  const partial = totalDays !== undefined && days.length < totalDays;

  return (
    <div className="forecast">
      <p className="forecast-summary">
        <span className="forecast-summary-range">
          {Math.round(Math.max(...highs))}°
          <span className="temp-sep">/</span>
          {Math.round(Math.min(...lows))}°
        </span>
        <span className="forecast-summary-detail">
          across {days.length} day{days.length === 1 ? "" : "s"}
          {wettest.precipProb >= 20
            ? ` · wettest ${weekdayLabel(wettest.date)} at ${wettest.precipProb}% rain`
            : " · little rain expected"}
        </span>
      </p>

      <ol className="forecast-days">
        {days.map((day, i) => (
          <li
            key={day.date}
            className="forecast-day"
            style={{ animationDelay: `${120 + i * 80}ms` }}
          >
            <header className="forecast-day-head">
              <span className="forecast-day-weekday">
                {weekdayLabel(day.date)}
              </span>
              <time className="forecast-day-date" dateTime={day.date}>
                {dayLabel(day.date)}
              </time>
            </header>
            <div className="forecast-day-body">
              <WeatherIcon condition={day.condition} size="md" />
              <p className="forecast-temps">
                <span className="temp-high temp-high--sm">
                  {Math.round(day.tempHigh)}°
                </span>
                <span className="temp-low">{Math.round(day.tempLow)}°</span>
              </p>
            </div>
            <p className="forecast-condition">{conditionLabel(day.condition)}</p>
            <dl className="current-stats current-stats--compact forecast-day-stats">
              <div>
                <dt>Rain</dt>
                <dd>{day.precipProb}%</dd>
              </div>
              <div>
                <dt>Wind</dt>
                <dd>{day.windMs.toFixed(1)} m/s</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>

      {partial ? (
        <p className="forecast-partial">
          Showing the first {days.length} of {totalDays} festival days — the
          rest is beyond the forecast horizon.
        </p>
      ) : null}
    </div>
  );
}
