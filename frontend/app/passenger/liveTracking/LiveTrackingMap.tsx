"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

type Bus = {
  id: string;
  route: string;
  from: string;
  to: string;
  heading: string;
  type: string;
  latitude: number;
  longitude: number;
};

type LiveTrackingMapProps = {
  buses: Bus[];
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

export default function LiveTrackingMap({ buses }: LiveTrackingMapProps) {
  const positions = buses.map((bus) => [bus.latitude, bus.longitude] as [number, number]);

  const busIcon = new L.Icon({
    iconUrl: "/icons/bus.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -28],
    // no shadow
  });

  return (
    <div className="relative h-125 w-full max-w-full overflow-hidden rounded-xl">
      <MapContainer center={[6.9271, 79.8612]} zoom={12} className="h-full w-full max-w-full" style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBusBounds positions={positions} />
        {buses.map((bus) => (
          <Marker key={bus.id} position={[bus.latitude, bus.longitude]} icon={busIcon}>
            <Popup>
              <div className="text-sm text-slate-700">
                <p className="font-semibold">{bus.id}</p>
                <p>
                  {bus.route} {bus.from} → {bus.to}
                </p>
                <p>Heading: {bus.heading}</p>
                <p>{bus.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
