import { WeatherIcon } from "@/components/WeatherIcon";
import { conditionLabel } from "@/lib/format";
import { SOURCE_LABELS, SOURCE_ORDER } from "@/lib/weather/labels";
import type {
  CurrentConditions,
  SourceCurrent,
  WeatherSourceName,
} from "@/lib/weather/types";

type Props = {
  sources: SourceCurrent[];
  sourcesFailed: WeatherSourceName[];
};

function formatObserved(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SourcePanel({
  label,
  current,
  index,
}: {
  label: string;
  current: CurrentConditions;
  index: number;
}) {
  return (
    <article
      className="source-panel"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <header className="source-panel-header">
        <h3 className="source-panel-name">{label}</h3>
        <time className="source-panel-time" dateTime={current.observedAt}>
          {formatObserved(current.observedAt)}
        </time>
      </header>
      <div className="source-panel-body">
        <WeatherIcon condition={current.condition} size="sm" />
        <div>
          <p className="forecast-temps">
            <span className="temp-high temp-high--sm">
              {Math.round(current.temp)}°
            </span>
            <span className="temp-low">
              feels {Math.round(current.feelsLike)}°
            </span>
          </p>
          <p className="forecast-condition">
            {conditionLabel(current.condition)}
          </p>
        </div>
      </div>
      <dl className="current-stats current-stats--compact">
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
      <p className="source-failed-msg">No reading from this source.</p>
    </article>
  );
}

export function SourceWeatherGrid({ sources, sourcesFailed }: Props) {
  const bySource = new Map(sources.map((s) => [s.source, s.current]));
  const failed = new Set(sourcesFailed);

  const entries = SOURCE_ORDER.filter(
    (name) => bySource.has(name) || failed.has(name),
  );

  if (entries.length === 0) {
    return (
      <p className="forecast-empty">No individual source readings available.</p>
    );
  }

  return (
    <div className="source-grid" role="list">
      {entries.map((name, i) => {
        const current = bySource.get(name);
        const label = SOURCE_LABELS[name];
        if (current) {
          return (
            <div key={name} role="listitem">
              <SourcePanel label={label} current={current} index={i} />
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
  );
}
