"use client";

import { useEffect, useRef } from "react";
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
  status?: string;
  lastUpdated?: string;
  distanceKm?: number;
};

type FleetMapProps = {
  buses: Bus[];
  focusBusId: string | null;
};

// ── Bus icon — same L.Icon approach as the passenger LiveTrackingMap ──────────
// Uses /icons/bus.png from public/. Identical config to passenger tracker.

const BUS_ICON = new L.Icon({
  iconUrl:     "/icons/bus.png",
  iconSize:    [36, 36],
  iconAnchor:  [18, 36],
  popupAnchor: [0, -28],
});

// ── Auto-fit bounds on first load ─────────────────────────────────────────────

function FitBounds({ positions }: { positions: Array<[number, number]> }) {
  const map  = useMap();
  const prev = useRef<string>("");

  useEffect(() => {
    const key = JSON.stringify(positions);
    if (key === prev.current) return;
    prev.current = key;

    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [64, 64], maxZoom: 14 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [map, positions]);

  return null;
}

// ── Fly to bus when selected from search ─────────────────────────────────────

function FocusBus({ buses, focusBusId }: { buses: Bus[]; focusBusId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focusBusId) return;
    const bus = buses.find(b => b.id === focusBusId);
    if (bus) map.flyTo([bus.latitude, bus.longitude], 16, { duration: 0.8 });
  }, [map, buses, focusBusId]);

  return null;
}

// ── Map ───────────────────────────────────────────────────────────────────────

export default function FleetMap({ buses, focusBusId }: FleetMapProps) {
  const positions = buses.map(b => [b.latitude, b.longitude] as [number, number]);

  return (
    <MapContainer
      center={[7.8731, 80.7718]}   // Sri Lanka centre
      zoom={8}
      style={{ height: "100%", width: "100%" }}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <FitBounds positions={positions} />
      <FocusBus buses={buses} focusBusId={focusBusId} />

      {buses.map(bus => (
        <Marker
          key={bus.id}
          position={[bus.latitude, bus.longitude]}
          icon={BUS_ICON}
        >
          <Popup>
            <div className="min-w-[160px] text-sm text-slate-700">
              <p className="font-bold text-[#122843]">{bus.id}</p>
              <p className="text-slate-600">
                {bus.routeName}
                {bus.from && bus.to ? ` · ${bus.from} → ${bus.to}` : ""}
              </p>
              {bus.heading     && <p className="mt-1 text-xs text-slate-500">Heading: {bus.heading}</p>}
              {bus.type        && <p className="text-xs text-slate-500">Type: {bus.type}</p>}
              {bus.lastUpdated && <p className="text-xs text-slate-400">Updated: {bus.lastUpdated}</p>}
              {typeof bus.distanceKm === "number" && (
                <p className="text-xs text-slate-400">{bus.distanceKm.toFixed(2)} km away</p>
              )}
              <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${
                (bus.status ?? "active").toLowerCase() === "inactive" ? "text-red-500" :
                (bus.status ?? "active").toLowerCase() === "stale"    ? "text-amber-500" :
                "text-emerald-600"
              }`}>
                ● {bus.status ?? "active"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}