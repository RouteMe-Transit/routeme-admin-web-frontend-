"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormDataState = {
  stopName: string;   // was "name" — fixed to match backend field
  longitude: string;
  latitude: string;
};

type StopsMapPickerProps = {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
};

// ─── Inner click handler (must live inside MapContainer) ──────────────────────
function LocationPicker({
  initialPosition,
  setFormData,
}: {
  initialPosition: [number, number] | null;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
}) {
  const [position, setPosition] = useState<[number, number] | null>(initialPosition);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setFormData((prev) => ({
        ...prev,
        latitude:  lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    },
  });

  return position ? <Marker position={position} /> : null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StopsMapPicker({ formData, setFormData }: StopsMapPickerProps) {
  // Each time this component unmounts (modal close, StrictMode remount, HMR)
  // we bump the key so MapContainer gets a brand-new DOM node on the next
  // mount — avoiding "Map container is already initialized".
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    return () => {
      setMapKey((k) => k + 1);
    };
  }, []);

  const center: [number, number] =
    formData.latitude && formData.longitude
      ? [Number(formData.latitude), Number(formData.longitude)]
      : [6.9271, 79.8612];

  const initialPosition: [number, number] | null =
    formData.latitude && formData.longitude
      ? [Number(formData.latitude), Number(formData.longitude)]
      : null;

  return (
    <div style={{ height: "260px", width: "100%" }} className="rounded overflow-hidden">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <LocationPicker
          initialPosition={initialPosition}
          setFormData={setFormData}
        />
      </MapContainer>
    </div>
  );
}