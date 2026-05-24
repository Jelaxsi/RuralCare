"use client";

import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { OsmHospital } from "@/lib/osm/geocoding";
import { formatDistance } from "@/lib/osm/geocoding";

type Props = {
  patientLat: number;
  patientLng: number;
  hospitals: OsmHospital[];
};

export default function OsmMapInner({ patientLat, patientLng, hospitals }: Props) {
  return (
    <MapContainer
      center={[patientLat, patientLng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl"
      style={{ height: "100%", width: "100%", background: "#0d1117" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <CircleMarker
        center={[patientLat, patientLng]}
        radius={10}
        pathOptions={{ color: "#00D4FF", fillColor: "#00D4FF", fillOpacity: 0.9, weight: 2 }}
      >
        <Popup>You are here</Popup>
      </CircleMarker>
      {hospitals.map((h) => (
        <CircleMarker
          key={h.id}
          center={[h.lat, h.lng]}
          radius={8}
          pathOptions={{ color: "#FF4560", fillColor: "#FF4560", fillOpacity: 0.85, weight: 2 }}
        >
          <Popup>
            <strong>{h.name}</strong>
            <br />
            {formatDistance(h.distanceMeters)} · {h.type}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
