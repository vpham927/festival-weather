import type { WeatherCondition } from "@/lib/weather/types";

type Props = {
  condition: WeatherCondition;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function WeatherIcon({
  condition,
  size = "md",
  className = "",
}: Props) {
  return (
    <span
      className={`weather-icon weather-icon--${size} weather-icon--${condition} ${className}`.trim()}
      aria-hidden
    >
      {iconFor(condition)}
    </span>
  );
}

type NoForecastProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Calendar + slash — used when festival-date forecast is out of range / unavailable. */
export function NoForecastIcon({
  size = "md",
  className = "",
}: NoForecastProps) {
  return (
    <span
      className={`weather-icon weather-icon--${size} weather-icon--no-forecast ${className}`.trim()}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
        <rect
          className="wi-cal"
          x="10"
          y="12"
          width="28"
          height="26"
          rx="3"
        />
        <path className="wi-cal-top" d="M10 20h28" />
        <path className="wi-cal-bind" d="M16 8v8M32 8v8" strokeLinecap="round" />
        <circle className="wi-cal-dot" cx="18" cy="28" r="1.6" />
        <circle className="wi-cal-dot" cx="24" cy="28" r="1.6" />
        <circle className="wi-cal-dot" cx="30" cy="28" r="1.6" />
        <path
          className="wi-cal-slash"
          d="M14 38 34 14"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function iconFor(condition: WeatherCondition) {
  switch (condition) {
    case "clear":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <circle className="wi-sun-core" cx="24" cy="24" r="8" />
          <g className="wi-sun-rays">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                className="wi-ray"
                x1="24"
                y1="6"
                x2="24"
                y2="11"
                transform={`rotate(${deg} 24 24)`}
              />
            ))}
          </g>
        </svg>
      );
    case "partly_cloudy":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <circle className="wi-sun-core wi-sun-core--small" cx="30" cy="16" r="6" />
          <g className="wi-sun-rays wi-sun-rays--small">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                className="wi-ray"
                x1="30"
                y1="4"
                x2="30"
                y2="8"
                transform={`rotate(${deg} 30 16)`}
              />
            ))}
          </g>
          <path
            className="wi-cloud"
            d="M14 34h18a7 7 0 0 0 0-14 9 9 0 0 0-17.2-2.5A6.5 6.5 0 0 0 14 34Z"
          />
        </svg>
      );
    case "cloudy":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <path
            className="wi-cloud wi-cloud--back"
            d="M16 28h16a6 6 0 0 0 0-12 8 8 0 0 0-15.3-2.2A5.5 5.5 0 0 0 16 28Z"
          />
          <path
            className="wi-cloud"
            d="M12 36h22a7 7 0 0 0 0-14 9.5 9.5 0 0 0-18.2-2.8A6.5 6.5 0 0 0 12 36Z"
          />
        </svg>
      );
    case "rain":
    case "heavy_rain":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <path
            className="wi-cloud"
            d="M12 26h22a7 7 0 0 0 0-14 9.5 9.5 0 0 0-18.2-2.8A6.5 6.5 0 0 0 12 26Z"
          />
          <g className="wi-rain">
            <line className="wi-drop" x1="16" y1="30" x2="14" y2="38" />
            <line className="wi-drop wi-drop--2" x1="24" y1="30" x2="22" y2="40" />
            <line className="wi-drop wi-drop--3" x1="32" y1="30" x2="30" y2="37" />
            {condition === "heavy_rain" ? (
              <>
                <line className="wi-drop wi-drop--4" x1="20" y1="31" x2="18" y2="41" />
                <line className="wi-drop wi-drop--5" x1="28" y1="31" x2="26" y2="39" />
              </>
            ) : null}
          </g>
        </svg>
      );
    case "storm":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <path
            className="wi-cloud"
            d="M12 24h22a7 7 0 0 0 0-14 9.5 9.5 0 0 0-18.2-2.8A6.5 6.5 0 0 0 12 24Z"
          />
          <path
            className="wi-bolt"
            d="M26 26 20 36h6l-3 8 10-14h-6l3-4Z"
          />
        </svg>
      );
    case "snow":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <path
            className="wi-cloud"
            d="M12 24h22a7 7 0 0 0 0-14 9.5 9.5 0 0 0-18.2-2.8A6.5 6.5 0 0 0 12 24Z"
          />
          <g className="wi-snow">
            <circle className="wi-flake" cx="16" cy="32" r="1.6" />
            <circle className="wi-flake wi-flake--2" cx="24" cy="36" r="1.6" />
            <circle className="wi-flake wi-flake--3" cx="32" cy="33" r="1.6" />
            <circle className="wi-flake wi-flake--4" cx="20" cy="40" r="1.3" />
            <circle className="wi-flake wi-flake--5" cx="28" cy="41" r="1.3" />
          </g>
        </svg>
      );
    case "fog":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <g className="wi-fog">
            <line className="wi-fog-line" x1="10" y1="18" x2="38" y2="18" />
            <line className="wi-fog-line wi-fog-line--2" x1="8" y1="24" x2="40" y2="24" />
            <line className="wi-fog-line wi-fog-line--3" x1="12" y1="30" x2="36" y2="30" />
            <line className="wi-fog-line wi-fog-line--4" x1="10" y1="36" x2="38" y2="36" />
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className="wi-svg">
          <circle className="wi-unknown" cx="24" cy="24" r="10" />
          <path
            className="wi-unknown-mark"
            d="M24 18v8M24 30.5v.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
