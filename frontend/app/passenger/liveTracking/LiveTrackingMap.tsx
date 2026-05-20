"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

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

export default function LiveTrackingMap({ buses }: LiveTrackingMapProps) {
  console.log(buses);
  return (
    <div className="relative h-125 w-full max-w-full overflow-hidden rounded-xl">
      <MapContainer center={[6.9271, 79.8612]} zoom={12} className="h-full w-full max-w-full" style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {buses.map((bus) => (
          <Marker key={bus.id} position={[bus.latitude, bus.longitude]}>
            <Popup>
              <div className="text-sm text-slate-700">
                <p className="font-semibold">{bus.id}</p>
                <p>Route {bus.route}: {bus.from} to {bus.to}</p>
                <p>Heading: {bus.heading}</p>
                <p>Type: {bus.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
