import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/osm/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const address = await reverseGeocode(lat, lon);
  return NextResponse.json({ address });
}
