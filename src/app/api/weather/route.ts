import { getAggregatedWeather } from "@/lib/weather";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json(
      { error: "Valid lat and lon are required." },
      { status: 400 },
    );
  }

  try {
    const weather = await getAggregatedWeather({ lat, lon });
    if (!weather.consensus.current) {
      return NextResponse.json(
        {
          error: "No current weather available for this location.",
          ...weather,
        },
        { status: 200 },
      );
    }
    return NextResponse.json(weather);
  } catch (err) {
    console.error("[api/weather]", err);
    return NextResponse.json(
      { error: "Failed to fetch weather." },
      { status: 500 },
    );
  }
}
