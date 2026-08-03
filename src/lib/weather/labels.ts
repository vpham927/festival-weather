import type { WeatherSourceName } from "./types";

export const SOURCE_LABELS: Record<WeatherSourceName, string> = {
  "open-meteo": "Open-Meteo",
  openweather: "OpenWeather",
  tomorrow: "Tomorrow.io",
  weatherapi: "WeatherAPI",
};

export const SOURCE_ORDER: WeatherSourceName[] = [
  "open-meteo",
  "openweather",
  "tomorrow",
  "weatherapi",
];
