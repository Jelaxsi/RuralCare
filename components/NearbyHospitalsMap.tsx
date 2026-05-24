"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { facilityByLocation } from "@/lib/facilities/lookup";
import { formatDistance, type OsmHospital } from "@/lib/osm/geocoding";

async function loadNearbyHospitals(lat: number, lng: number): Promise<OsmHospital[]> {
  const res = await fetch(`/api/osm/hospitals?lat=${lat}&lon=${lng}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { hospitals?: OsmHospital[] };
  return data.hospitals ?? [];
}
import type { TranslationKeys } from "@/lib/i18n/translations";
import type { Priority } from "@/lib/types";

const OsmMapInner = dynamic(() => import("./OsmMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/50">
      Loading map…
    </div>
  ),
});

type Props = {
  lat: number | null;
  lng: number | null;
  locationLabel: string;
  priority: Priority;
  t: TranslationKeys;
};

export function NearbyHospitalsMap({ lat, lng, locationLabel, priority, t }: Props) {
  const [hospitals, setHospitals] = useState<OsmHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setHospitals([]);
      setNoResults(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNoResults(false);

    void loadNearbyHospitals(lat, lng).then((results) => {
      if (cancelled) return;
      setHospitals(results);
      setNoResults(results.length === 0);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (lat == null || lng == null) {
    const facility = facilityByLocation(locationLabel, priority);
    return (
      <section className="glass-card border-l-4 border-l-accent-cyan p-6">
        <h3 className="text-lg font-semibold text-white">{t.nearestHospitals}</h3>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-semibold text-white">{facility.name}</p>
          <p className="mt-2 text-sm text-white/60">{facility.distance} · {facility.hours}</p>
          <a
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(facility.name)}`}
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

      <div className="mt-4 h-[400px] overflow-hidden rounded-2xl border border-white/10">
        <OsmMapInner patientLat={lat} patientLng={lng} hospitals={hospitals} />
      </div>

      {loading && <p className="mt-3 text-sm text-white/50">Searching nearby facilities…</p>}

      {noResults && (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {t.noHospitalsNearby}
        </p>
      )}

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
              {formatDistance(h.distanceMeters)} · {h.type}
            </p>
            <a
              href={`https://www.openstreetmap.org/directions?from=${lat}%2C${lng}&to=${h.lat}%2C${h.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white hover:border-primary"
            >
              {t.getDirections}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
