"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

type FormDataState = {
  name: string;
  longitude: string;
  latitude: string;
};

type StopsMapPickerProps = {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
};

function LocationPicker({ formData, setFormData }: StopsMapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setPosition([Number(formData.latitude), Number(formData.longitude)]);
    }
  }, [formData.latitude, formData.longitude]);

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

  return position ? <Marker position={position} /> : null;
}

export default function StopsMapPicker({ formData, setFormData }: StopsMapPickerProps) {
  const center: [number, number] = formData.latitude
    ? [Number(formData.latitude), Number(formData.longitude)]
    : [6.9271, 79.8612];

  return (
    <div className="h-75 rounded overflow-hidden">
      <MapContainer center={center} zoom={10} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker formData={formData} setFormData={setFormData} />
      </MapContainer>
    </div>
  );
}
