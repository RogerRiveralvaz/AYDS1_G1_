import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";

import { ensureLeafletIcons } from "./leaflet";

const DEFAULT_CENTER: LatLngLiteral = { lat: 14.6349, lng: -90.5069 };

type MapPickerProps = {
  value?: LatLngLiteral | null;
  onChange?: (coords: LatLngLiteral) => void;
  height?: number;
};

function MapClickHandler({ onChange }: { onChange?: (coords: LatLngLiteral) => void }) {
  useMapEvents({
    click(event) {
      onChange?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export function MapPicker({ value, onChange, height = 280 }: MapPickerProps) {
  useEffect(() => {
    ensureLeafletIcons();
  }, []);

  if (typeof window === "undefined") {
    return <div style={{ height }} className="rounded-lg bg-slate-100 dark:bg-slate-800" />;
  }

  return (
    <MapContainer
      center={value ?? DEFAULT_CENTER}
      zoom={13}
      style={{ height }}
      className="rounded-lg border border-slate-200 dark:border-slate-700"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      <MapClickHandler onChange={onChange} />
      {value ? <Marker position={value} /> : null}
    </MapContainer>
  );
}
