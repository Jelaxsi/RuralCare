export type OsmHospital = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "Hospital" | "Clinic";
  distanceMeters: number;
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; amenity?: string };
};

async function queryOverpass(lat: number, lon: number, radius: number): Promise<OsmHospital[]> {
  const query = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radius},${lat},${lon});
  way["amenity"="hospital"](around:${radius},${lat},${lon});
  node["amenity"="clinic"](around:${radius},${lat},${lon});
  way["amenity"="clinic"](around:${radius},${lat},${lon});
);
out body center;
`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { elements?: OverpassElement[] };
  const elements = data.elements ?? [];

  const hospitals: OsmHospital[] = [];

  for (const el of elements) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    const name = el.tags?.name?.trim();
    if (!name) continue;

    const amenity = el.tags?.amenity;
    hospitals.push({
      id: `${el.type}-${el.id}`,
      name,
      lat: elLat,
      lng: elLng,
      type: amenity === "clinic" ? "Clinic" : "Hospital",
      distanceMeters: haversine(lat, lon, elLat, elLng),
    });
  }

  const byId = new Map<string, OsmHospital>();
  for (const h of hospitals) {
    const existing = byId.get(h.name);
    if (!existing || h.distanceMeters < existing.distanceMeters) {
      byId.set(h.name, h);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 5);
}

export async function fetchNearbyHospitals(lat: number, lon: number): Promise<OsmHospital[]> {
  let results = await queryOverpass(lat, lon, 5000);
  if (results.length === 0) {
    results = await queryOverpass(lat, lon, 10000);
  }
  return results;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          "User-Agent": "RuralCare-Triage/1.0 (emergency healthcare app)",
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name?.trim() ?? null;
  } catch {
    return null;
  }
}
