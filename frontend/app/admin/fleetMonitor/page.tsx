"use client";

import api from "@/app/services/api";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type BusStatus = "active" | "stale" | "inactive" | string;

type Bus = {
  id: string;
  routeName: string;
  from?: string;
  to?: string;
  heading?: string;
  type?: string;
  latitude: number;
  longitude: number;
  status?: BusStatus;
  lastUpdated?: string;
  distanceKm?: number;
};

type LiveTrackingResponse = {
  buses: Bus[];
  pollingIntervalSeconds?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeBus(raw: unknown, index: number): Bus | null {
  if (!isObject(raw)) return null;
  const location = isObject(raw.location) ? raw.location : null;
  const latitude = toNumber(raw.latitude ?? raw.lat ?? location?.latitude);
  const longitude = toNumber(raw.longitude ?? raw.lng ?? raw.lon ?? location?.longitude);
  if (latitude === null || longitude === null) return null;

  const routeName =
    typeof raw.routeName === "string" ? raw.routeName :
    typeof raw.route === "string" ? raw.route :
    typeof raw.routeNumber === "string" ? raw.routeNumber : "Unknown route";

  const id =
    typeof raw.id === "string" ? raw.id :
    typeof raw.registrationNumber === "string" ? raw.registrationNumber :
    `bus-${index + 1}`;

  return {
    id,
    routeName,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    heading: typeof raw.heading === "string" ? raw.heading : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    latitude,
    longitude,
    status: typeof raw.status === "string" ? raw.status : undefined,
    lastUpdated:
      typeof raw.lastUpdated === "string" ? raw.lastUpdated :
      typeof raw.timestamp === "string" ? raw.timestamp : undefined,
    distanceKm: toNumber(raw.distanceKm ?? raw.distance_km ?? raw.distance) ?? undefined,
  };
}

function parseLiveTrackingResponse(payload: unknown): LiveTrackingResponse {
  if (!isObject(payload)) return { buses: [] };
  const rootData = isObject(payload.data) ? payload.data : payload;
  const busesSource =
    Array.isArray(rootData.buses) ? rootData.buses :
    Array.isArray(rootData.items) ? rootData.items :
    Array.isArray(payload) ? payload : [];
  const pollingIntervalSeconds = toNumber(
    rootData.pollingIntervalSeconds ?? payload.pollingIntervalSeconds,
  );
  return {
    buses: busesSource
      .map((b, i) => normalizeBus(b, i))
      .filter((b): b is Bus => b !== null),
    pollingIntervalSeconds: pollingIntervalSeconds ?? undefined,
  };
}

// ── Map (dynamic — no SSR) ───────────────────────────────────────────────────

const FleetMap = dynamic(() => import("@/app/admin/fleetMonitor/FleetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#e8f4e8] text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_POLL = 15;

export default function FleetMonitorPage() {
  const [buses, setBuses]               = useState<Bus[]>([]);
  const [pollInterval, setPollInterval] = useState(DEFAULT_POLL);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [lastSync, setLastSync]         = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [focusBusId, setFocusBusId]     = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const fetchBuses = useCallback(async (silent = false) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (!token) { setError("Please log in as admin."); setIsLoading(false); return; }

    if (!silent) setIsRefreshing(true);
    try {
      // /buses/live/all — admin-only endpoint, returns every active bus with no radius filter
      const res = await api.get("/buses/live/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = parseLiveTrackingResponse(res.data);
      setBuses(parsed.buses);
      if (parsed.pollingIntervalSeconds) setPollInterval(parsed.pollingIntervalSeconds);
      setLastSync(new Date().toLocaleTimeString());
      setError(null);
    } catch {
      setError("Unable to fetch live buses.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchBuses();
    timerRef.current = window.setInterval(() => void fetchBuses(true), pollInterval * 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [fetchBuses, pollInterval]);

  const query = search.trim().toLowerCase();
  const filteredBuses = query
    ? buses.filter(b =>
        b.id.toLowerCase().includes(query) ||
        b.routeName.toLowerCase().includes(query),
      )
    : buses;

  // Status counts (always from full list)
  const counts = { active: 0, stale: 0, inactive: 0 };
  buses.forEach(b => {
    const s = (b.status ?? "active").toLowerCase();
    if (s === "stale") counts.stale++;
    else if (s === "inactive") counts.inactive++;
    else counts.active++;
  });

  return (
    // Full-bleed: takes up whatever space the admin shell gives it
    <div className="relative flex h-full w-full flex-col overflow-hidden">

      {/* ── Error banner ── */}
      {error && (
        <div className="absolute inset-x-0 top-0 z-[1000] border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Map (full area) ── */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-[#e8f4e8] text-sm text-slate-500">
            Loading live buses…
          </div>
        ) : (
          <FleetMap buses={filteredBuses} focusBusId={focusBusId} />
        )}
      </div>

      {/* ── Floating search bar overlay ── */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-[900] flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-md rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm">

          {/* Search input row */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search bus number"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              value={search}
              onChange={e => { setSearch(e.target.value); setFocusBusId(null); }}
              onKeyDown={e => {
                if (e.key === "Enter" && filteredBuses.length >= 1) {
                  setFocusBusId(filteredBuses[0].id);
                }
              }}
            />
            {search ? (
              <button
                onClick={() => { setSearch(""); setFocusBusId(null); }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => void fetchBuses()}
                disabled={isRefreshing}
                className="rounded-md bg-[#122843] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#1a3a5c] disabled:opacity-50"
              >
                {isRefreshing ? "…" : "Refresh"}
              </button>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5">
            <div className="flex items-center gap-3">
              <StatusPill label="Active"   count={counts.active}   color="emerald" />
              <StatusPill label="Stale"    count={counts.stale}    color="amber"   />
              <StatusPill label="Inactive" count={counts.inactive} color="red"     />
            </div>
            <p className="text-[11px] text-slate-400">
              {lastSync ? <>sync {lastSync}</> : `polling ${pollInterval}s`}
            </p>
          </div>

          {/* Dropdown results — only shown when searching */}
          {query && (
            <div className="max-h-52 overflow-y-auto border-t border-slate-100">
              {filteredBuses.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">No buses match "{search}"</p>
              ) : filteredBuses.map(bus => (
                <button
                  key={bus.id}
                  onClick={() => { setFocusBusId(bus.id); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 ${focusBusId === bus.id ? "bg-blue-50" : ""}`}
                >
                  <span className="text-sm font-semibold text-[#122843]">{bus.id}</span>
                  <span className="flex-1 truncate text-xs text-slate-500">
                    {bus.routeName}{bus.from && bus.to ? ` · ${bus.from} → ${bus.to}` : ""}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClasses(bus.status)}`}>
                    {bus.status ?? "active"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusClasses(status?: string) {
  const s = (status ?? "active").toLowerCase();
  if (s === "inactive") return "bg-red-100 text-red-600 border-red-200";
  if (s === "stale")    return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function StatusPill({ label, count, color }: { label: string; count: number; color: "emerald" | "amber" | "red" }) {
  const cls = {
    emerald: "text-emerald-700",
    amber:   "text-amber-600",
    red:     "text-red-500",
  }[color];
  return (
    <div className={`flex items-center gap-1 text-[11px] font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {count} {label}
    </div>
  );
}