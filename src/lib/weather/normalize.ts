import type { WeatherCondition } from "./types";

/** Map Open-Meteo / WMO weather codes to a shared condition. */
export function conditionFromWmo(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code <= 2) return "partly_cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "heavy_rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "unknown";
}

export function conditionFromOpenWeather(main: string): WeatherCondition {
  const m = main.toLowerCase();
  if (m === "clear") return "clear";
  if (m === "clouds") return "cloudy";
  if (m === "rain" || m === "drizzle") return "rain";
  if (m === "thunderstorm") return "storm";
  if (m === "snow") return "snow";
  if (m === "mist" || m === "fog" || m === "haze") return "fog";
  return "unknown";
}

/** Tomorrow.io weather codes → shared condition. */
export function conditionFromTomorrow(code: number): WeatherCondition {
  if (code === 1000 || code === 1100) return "clear";
  if (code === 1101) return "partly_cloudy";
  if (code === 1102 || code === 1001) return "cloudy";
  if (code === 2000 || code === 2100) return "fog";
  if (code === 4000 || code === 4200 || code === 4001) return "rain";
  if (code === 4201) return "heavy_rain";
  if (
    code === 5000 ||
    code === 5001 ||
    code === 5100 ||
    code === 5101 ||
    code === 6000 ||
    code === 6001 ||
    code === 6200 ||
    code === 6201 ||
    code === 7000 ||
    code === 7101 ||
    code === 7102
  ) {
    return "snow";
  }
  if (code === 8000) return "storm";
  return "unknown";
}

/** WeatherAPI condition codes → shared condition. */
export function conditionFromWeatherApi(code: number): WeatherCondition {
  if (code === 1000) return "clear";
  if (code === 1003) return "partly_cloudy";
  if (code === 1006 || code === 1009) return "cloudy";
  if (code === 1030 || code === 1135 || code === 1147) return "fog";
  if (
    code === 1063 ||
    code === 1150 ||
    code === 1153 ||
    code === 1168 ||
    code === 1171 ||
    code === 1180 ||
    code === 1183 ||
    code === 1186 ||
    code === 1189 ||
    code === 1198 ||
    code === 1240 ||
    code === 1249 ||
    code === 1273
  ) {
    return "rain";
  }
  if (
    code === 1192 ||
    code === 1195 ||
    code === 1201 ||
    code === 1243 ||
    code === 1246
  ) {
    return "heavy_rain";
  }
  if (
    code === 1066 ||
    code === 1069 ||
    code === 1072 ||
    code === 1114 ||
    code === 1117 ||
    code === 1210 ||
    code === 1213 ||
    code === 1216 ||
    code === 1219 ||
    code === 1222 ||
    code === 1225 ||
    code === 1237 ||
    code === 1255 ||
    code === 1258 ||
    code === 1261 ||
    code === 1264
  ) {
    return "snow";
  }
  if (code === 1087 || code === 1276 || code === 1279 || code === 1282) {
    return "storm";
  }
  return "unknown";
}

/** Google Weather API `weatherCondition.type` → shared condition. */
export function conditionFromGoogle(type: string | undefined): WeatherCondition {
  if (!type) return "unknown";

  switch (type) {
    case "CLEAR":
    case "MOSTLY_CLEAR":
      return "clear";
    case "PARTLY_CLOUDY":
      return "partly_cloudy";
    case "MOSTLY_CLOUDY":
    case "CLOUDY":
    case "WINDY":
      return "cloudy";
    case "FOG":
    case "HAZE":
    case "SMOKE":
      return "fog";
    case "HEAVY_RAIN":
    case "HEAVY_RAIN_SHOWERS":
    case "MODERATE_TO_HEAVY_RAIN":
    case "RAIN_PERIODICALLY_HEAVY":
      return "heavy_rain";
    case "WIND_AND_RAIN":
    case "LIGHT_RAIN_SHOWERS":
    case "CHANCE_OF_SHOWERS":
    case "SCATTERED_SHOWERS":
    case "RAIN_SHOWERS":
    case "LIGHT_TO_MODERATE_RAIN":
    case "RAIN":
    case "LIGHT_RAIN":
    case "DRIZZLE":
      return "rain";
    case "THUNDERSTORM":
    case "THUNDERSHOWER":
    case "LIGHT_THUNDERSTORM_RAIN":
    case "SCATTERED_THUNDERSTORMS":
    case "HEAVY_THUNDERSTORM":
    case "HAIL":
    case "HAIL_SHOWERS":
      return "storm";
    case "LIGHT_SNOW_SHOWERS":
    case "CHANCE_OF_SNOW_SHOWERS":
    case "SCATTERED_SNOW_SHOWERS":
    case "SNOW_SHOWERS":
    case "HEAVY_SNOW_SHOWERS":
    case "LIGHT_TO_MODERATE_SNOW":
    case "MODERATE_TO_HEAVY_SNOW":
    case "SNOW":
    case "LIGHT_SNOW":
    case "HEAVY_SNOW":
    case "SNOWSTORM":
    case "HEAVY_SNOW_STORM":
    case "BLOWING_SNOW":
    case "SLEET":
    case "FREEZING_RAIN":
    case "ICE_PELLETS":
      return "snow";
    default:
      if (type.includes("THUNDER") || type.includes("STORM")) return "storm";
      if (type.includes("SNOW") || type.includes("ICE")) return "snow";
      if (type.includes("HEAVY_RAIN")) return "heavy_rain";
      if (type.includes("RAIN") || type.includes("SHOWER") || type.includes("DRIZZLE")) {
        return "rain";
      }
      if (type.includes("FOG") || type.includes("HAZE") || type.includes("MIST")) {
        return "fog";
      }
      if (type.includes("CLOUD")) return "cloudy";
      if (type.includes("CLEAR") || type.includes("SUN")) return "clear";
      return "unknown";
  }
}

/** Majority vote for condition strings. */
export function majorityCondition(
  conditions: WeatherCondition[],
): WeatherCondition {
  if (conditions.length === 0) return "unknown";
  const counts = new Map<WeatherCondition, number>();
  for (const c of conditions) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: WeatherCondition = conditions[0];
  let bestCount = 0;
  for (const [c, n] of counts) {
    if (n > bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
