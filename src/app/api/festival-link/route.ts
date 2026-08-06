import { getFestivalById } from "@/data/festival-repository";
import { getFestivalEventLink } from "@/lib/festival-lineup";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing festival id" }, { status: 400 });
  }

  const festival = await getFestivalById(id);
  if (!festival) {
    return NextResponse.json({ error: "Festival not found" }, { status: 404 });
  }

  const website = festival.website?.trim() ?? "";
  if (!website) {
    return NextResponse.json(
      { error: "Festival has no website in the database" },
      { status: 404 },
    );
  }

  const link = await getFestivalEventLink(website);
  if (!link) {
    return NextResponse.json({ error: "Could not resolve event link" }, { status: 404 });
  }

  return NextResponse.json(link);
}
