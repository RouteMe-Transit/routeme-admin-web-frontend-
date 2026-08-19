"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L, { LeafletMouseEvent } from "leaflet";

// ─── Marker icon (CDN — avoids Next.js/Turbopack image-import issues) ─────────
const stopIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ─── Types ────────────────────────────────────────────────────────────────────
type FormDataState = {
  stopName: string;
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
  formData,
  setFormData,
}: {
  initialPosition: [number, number] | null;
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
}) {
  const [position, setPosition] = useState<[number, number] | null>(initialPosition);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    },
  });

  if (!position) return null;

  return (
    <Marker position={position} icon={stopIcon}>
      <Popup>
        <div className="text-xs">
          <p className="font-bold">{formData.stopName || "New Stop"}</p>
          <p>Lat: {position[0].toFixed(6)}</p>
          <p>Lng: {position[1].toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StopsMapPicker({ formData, setFormData }: StopsMapPickerProps) {
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
          formData={formData}
          setFormData={setFormData}
        />
      </MapContainer>
    </div>
  );
}