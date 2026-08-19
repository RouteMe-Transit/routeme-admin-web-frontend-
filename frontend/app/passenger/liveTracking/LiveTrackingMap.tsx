"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

type Bus = {
  id: string;
  routeName: string;
  from?: string;
  to?: string;
  heading?: string;
  type?: string;
  latitude: number;
  longitude: number;
  status?: "active" | "stale" | "inactive" | string;
};

type LiveTrackingMapProps = {
  buses: Bus[];
  currentLocation?: {
    latitude: number;
    longitude: number;
  } | null;
};

function FitBusBounds({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [32, 32] });
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [map, positions]);

  return null;
}

function FollowCurrentLocation({ currentLocation }: { currentLocation: LiveTrackingMapProps["currentLocation"] }) {
  const map = useMap();

  useEffect(() => {
    if (currentLocation) {
      map.setView([currentLocation.latitude, currentLocation.longitude], 14);
    }
  }, [currentLocation, map]);

  return null;
}

export default function LiveTrackingMap({ buses, currentLocation }: LiveTrackingMapProps) {
  const positions = buses.map((bus) => [bus.latitude, bus.longitude] as [number, number]);

  const busIcon = new L.Icon({
    iconUrl: "/icons/bus.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -28],
    // no shadow
  });

  const userIcon = L.divIcon({
    className: "",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: #2563eb;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.18);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -8],
  });

  return (
    <div className="relative h-125 w-full max-w-full overflow-hidden rounded-xl">
      <MapContainer center={[6.9271, 79.8612]} zoom={12} className="h-full w-full max-w-full" style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBusBounds positions={positions} />
        <FollowCurrentLocation currentLocation={currentLocation} />
        {currentLocation && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={userIcon}>
            <Popup>
              <div className="text-sm text-slate-700">
                <p className="font-semibold">Your current location</p>
                <p>Lat: {currentLocation.latitude.toFixed(5)}</p>
                <p>Lng: {currentLocation.longitude.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}
        {buses.map((bus) => (
          <Marker key={bus.id} position={[bus.latitude, bus.longitude]} icon={busIcon}>
            <Popup>
              <div className="text-sm text-slate-700">
                <p className="font-semibold">{bus.id}</p>
                <p>
                  {bus.routeName}
                  {bus.from && bus.to ? ` ${bus.from} → ${bus.to}` : ""}
                </p>
                {bus.heading && <p>Heading: {bus.heading}</p>}
                {bus.type && <p>{bus.type}</p>}
                <p>Status: {(bus.status ?? "active").toString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
