"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { facilityByLocation } from "@/lib/facilities/lookup";
import type { TranslationKeys } from "@/lib/i18n/translations";
import type { Priority } from "@/lib/types";

/**
 * Requires Google Cloud APIs enabled:
 * - Maps JavaScript API
 * - Places API
 * - Geocoding API
 */

type HospitalPlace = {
  id: string;
  name: string;
  distance: string;
  distanceMeters: number;
  rating?: number;
  openNow?: boolean;
  phone?: string;
  lat: number;
  lng: number;
};

type Props = {
  lat: number | null;
  lng: number | null;
  locationLabel: string;
  priority: Priority;
  t: TranslationKeys;
};

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#21262d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "poi.medical", elementType: "geometry", stylers: [{ color: "#3d1f24" }] },
];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function NearbyHospitalsMap({ lat, lng, locationLabel, priority, t }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hospitals, setHospitals] = useState<HospitalPlace[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || lat === null || lng === null) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function initMap() {
      try {
        const loader = new Loader({ apiKey: apiKey!, version: "weekly", libraries: ["places"] });
        const google = await loader.load();
        if (cancelled || !mapRef.current) return;

        const center = { lat, lng };
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
        });

        new google.maps.Marker({
          map,
          position: center,
          title: "Your location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00D4FF",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });

        const service = new google.maps.places.PlacesService(map);
        service.nearbySearch(
          { location: center, radius: 5000, type: "hospital" },
          (results, status) => {
            if (cancelled) return;
            if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
              setMapError("No hospitals found nearby.");
              setLoading(false);
              return;
            }

            const places: HospitalPlace[] = results.slice(0, 5).map((r, i) => {
              const rLat = r.geometry?.location?.lat() ?? lat!;
              const rLng = r.geometry?.location?.lng() ?? lng!;
              const dist = haversine(lat!, lng!, rLat, rLng);
              return {
                id: r.place_id ?? `h-${i}`,
                name: r.name ?? "Hospital",
                distance: formatDistance(dist),
                distanceMeters: dist,
                rating: r.rating,
                openNow: r.opening_hours?.isOpen?.(),
                phone: r.formatted_phone_number,
                lat: rLat,
                lng: rLng,
              };
            });

            places.sort((a, b) => a.distanceMeters - b.distanceMeters);
            setHospitals(places);

            places.forEach((p) => {
              new google.maps.Marker({
                map,
                position: { lat: p.lat, lng: p.lng },
                title: p.name,
              });
            });

            setLoading(false);
          },
        );
      } catch {
        if (!cancelled) {
          setMapError("Could not load map.");
          setLoading(false);
        }
      }
    }

    void initMap();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (lat === null || lng === null) {
    const fallback = facilityByLocation(locationLabel, priority);
    return (
      <section className="glass-card border-l-4 border-l-accent-cyan p-6">
        <h3 className="text-lg font-semibold text-white">{t.nearestHospitals}</h3>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-semibold text-white">{fallback.name}</p>
          <p className="mt-2 text-sm text-white/60">{fallback.distance} · {fallback.hours}</p>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(fallback.name)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-glow mt-4 inline-flex rounded-xl bg-gradient-to-r from-primary to-accent-cyan px-4 py-2 text-sm font-semibold text-white"
          >
            {t.getDirections}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card border-l-4 border-l-accent-cyan p-6">
      <h3 className="text-lg font-semibold text-white">{t.nearestHospitals}</h3>
      <div ref={mapRef} className="mt-4 h-[400px] w-full overflow-hidden rounded-2xl border border-white/10" />
      {loading && <p className="mt-3 text-sm text-white/50">Loading map…</p>}
      {mapError && <p className="mt-3 text-sm text-amber-400">{mapError}</p>}
      <div className="mt-4 space-y-3">
        {hospitals.map((h, idx) => (
          <div
            key={h.id}
            className={`rounded-2xl border bg-white/[0.03] p-4 ${
              priority === "P1" && idx === 0
                ? "animate-pulse border-danger/60 ring-2 ring-danger/30"
                : "border-white/10"
            }`}
          >
            {priority === "P1" && idx === 0 && (
              <span className="mb-2 inline-block rounded-full bg-danger/20 px-3 py-0.5 text-xs font-bold text-danger">
                {t.nearestEmergencyBadge}
              </span>
            )}
            <p className="font-semibold text-white">{h.name}</p>
            <p className="mt-1 text-sm text-white/60">
              {h.distance}
              {h.rating ? ` · ★ ${h.rating}` : ""}
              {h.openNow !== undefined ? ` · ${h.openNow ? t.openNow : t.closedNow}` : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white hover:border-primary"
              >
                {t.getDirections}
              </a>
              {h.phone && (
                <a href={`tel:${h.phone.replace(/\s+/g, "")}`} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white hover:border-primary">
                  {t.callBtn}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
