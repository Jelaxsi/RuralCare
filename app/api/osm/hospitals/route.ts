import { NextResponse } from "next/server";
import { fetchNearbyHospitals } from "@/lib/osm/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const hospitals = await fetchNearbyHospitals(lat, lon);
  return NextResponse.json({ hospitals });
}
