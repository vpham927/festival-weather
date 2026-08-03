import { getAggregatedForecast, getAggregatedWeather } from "@/lib/weather";
import { NextRequest, NextResponse } from "next/server";

function isValidCoord(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function isIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const includeForecast = isIsoDate(start) && isIsoDate(end);

  if (!isValidCoord(lat, lon)) {
    return NextResponse.json(
      { error: "Valid lat and lon are required." },
      { status: 400 },
    );
  }

  try {
    if (includeForecast) {
      const [currentResult, forecastResult] = await Promise.allSettled([
        getAggregatedWeather({ lat, lon }),
        getAggregatedForecast({ lat, lon, start, end }),
      ]);

      const weather =
        currentResult.status === "fulfilled" ? currentResult.value : null;
      const forecast =
        forecastResult.status === "fulfilled" ? forecastResult.value : null;

      if (!weather && !forecast) {
        return NextResponse.json(
          { error: "Failed to fetch weather." },
          { status: 500 },
        );
      }

      return NextResponse.json({ weather, forecast });
    }

    const weather = await getAggregatedWeather({ lat, lon });
    return NextResponse.json(weather);
  } catch (err) {
    console.error("[api/weather]", err);
    return NextResponse.json(
      { error: "Failed to fetch weather." },
      { status: 500 },
    );
  }
}
