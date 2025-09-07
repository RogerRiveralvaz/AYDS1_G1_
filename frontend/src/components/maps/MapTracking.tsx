import type { LatLngLiteral } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";

import { ensureLeafletIcons } from "./leaflet";

type MapTrackingProps = {
  pickup?: LatLngLiteral;
  delivery?: LatLngLiteral;
  courier?: LatLngLiteral | null;
  height?: number;
};

export function MapTracking({ pickup, delivery, courier, height = 240 }: MapTrackingProps) {
  useEffect(() => {
    ensureLeafletIcons();
  }, []);

  const center = courier ?? pickup ?? delivery;

  if (!center || typeof window === "undefined") {
    return <div style={{ height }} className="rounded-lg bg-slate-100 dark:bg-slate-800" />;
  }

  const path = [pickup, courier, delivery].filter(Boolean) as LatLngLiteral[];

  return (
    <MapContainer center={center} zoom={14} style={{ height }} className="rounded-lg border border-slate-200 dark:border-slate-700">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      {pickup ? <Marker position={pickup} /> : null}
      {delivery ? <Marker position={delivery} /> : null}
      {courier ? <Marker position={courier} /> : null}
      {path.length >= 2 ? <Polyline positions={path} color="#2563eb" /> : null}
    </MapContainer>
  );
}
