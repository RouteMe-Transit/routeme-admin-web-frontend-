"use client";

import { useState, useMemo } from "react";

type BusStatus = "On Time" | "Delayed" | "Breakdown";

type BusEntry = {
  id: string;
  route: string;
  routeDesc: string;
  driver: string;
  status: BusStatus;
  speed: number;
  eta: string;
  // Map position
  mapTop: string;
  mapLeft: string;
};

// ── Single source of truth — map markers derive from this ────────────────────
const SEED_BUSES: BusEntry[] = [
  { id: "Bus 12", route: "Route 1", routeDesc: "Colombo Fort → Kandy",   driver: "A. Perera",      status: "On Time",   speed: 42, eta: "3 min",  mapTop: "31%", mapLeft: "14%" },
  { id: "Bus 45", route: "Route 2", routeDesc: "Colombo Fort → Gampaha", driver: "S. Silva",       status: "On Time",   speed: 38, eta: "9 min",  mapTop: "22%", mapLeft: "52%" },
  { id: "Bus 88", route: "Route 3", routeDesc: "Colombo Fort → Negombo", driver: "K. Fernando",    status: "Breakdown", speed: 0,  eta: "—",      mapTop: "38%", mapLeft: "68%" },
  { id: "Bus 21", route: "Route 4", routeDesc: "Pettah → Maharagama",    driver: "R. Wijewardena", status: "Delayed",   speed: 12, eta: "35 min", mapTop: "47%", mapLeft: "46%" },
  { id: "Bus 35", route: "Route 5", routeDesc: "Nugegoda → Moratuwa",    driver: "T. Bandara",     status: "On Time",   speed: 45, eta: "6 min",  mapTop: "59%", mapLeft: "20%" },
];

// ── Consistent color tokens keyed by status ───────────────────────────────────
const STATUS_MARKER_BG: Record<BusStatus, string> = {
  "On Time":   "bg-[#122843]",
  "Delayed":   "bg-amber-500",
  "Breakdown": "bg-red-500",
};
const STATUS_DOT: Record<BusStatus, string> = {
  "On Time":   "bg-[#61de9f]",
  "Delayed":   "bg-amber-200",
  "Breakdown": "bg-red-200",
};
const STATUS_BADGE: Record<BusStatus, string> = {
  "On Time":   "bg-[#61de9f] text-[#00796b]",
  "Delayed":   "bg-yellow-100 text-yellow-700",
  "Breakdown": "bg-red-100 text-red-600",
};
const LEGEND_DOT: Record<BusStatus, string> = {
  "On Time":   "bg-[#61de9f]",
  "Delayed":   "bg-amber-400",
  "Breakdown": "bg-red-400",
};

const ALL_ROUTES = [...new Set(SEED_BUSES.map((b) => b.route))];

export default function FleetMonitorPage() {
  const [search,       setSearch]       = useState("");
  const [routeFilter,  setRouteFilter]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing,   setRefreshing]   = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SEED_BUSES.filter((b) => {
      const mQ = !q || b.id.toLowerCase().includes(q) || b.route.toLowerCase().includes(q) || b.driver.toLowerCase().includes(q);
      const mR = !routeFilter  || b.route  === routeFilter;
      const mS = !statusFilter || b.status === statusFilter;
      return mQ && mR && mS;
    });
  }, [search, routeFilter, statusFilter]);

  // Live status counts always from full SEED (not filtered) — matches Figma
  const onTime    = SEED_BUSES.filter((b) => b.status === "On Time").length;
  const delayed   = SEED_BUSES.filter((b) => b.status === "Delayed").length;
  const breakdown = SEED_BUSES.filter((b) => b.status === "Breakdown").length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#122843]">Fleet Monitor</h1>
        <p className="text-sm text-[#94a0ae] mt-0.5">Real time GPS tracking of all buses</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-72 shadow-sm">
          <img src="/icons/lens.png" className="w-5 h-5 opacity-50" alt="" />
          <input
            type="text"
            placeholder="Search bus number or route..."
            className="flex-1 text-sm bg-transparent outline-none text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black shadow-sm"
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
        >
          <option value="">All Routes</option>
          {ALL_ROUTES.map((r) => <option key={r}>{r}</option>)}
        </select>

        <select
          className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black shadow-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option>On Time</option>
          <option>Delayed</option>
          <option>Breakdown</option>
        </select>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition disabled:opacity-60 shadow-sm"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

        {/* ── Map panel ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative h-[460px] bg-[#e8f0e4]">

            {/* Road lines */}
            <div className="absolute top-[35%] left-[10%] w-[80%] h-0.5 bg-[#b5c9a8] rounded" />
            <div className="absolute top-[20%] left-[40%] w-0.5 h-[62%] bg-[#b5c9a8] rounded" />
            <div className="absolute top-[55%] left-[15%] w-[38%] h-0.5 bg-[#b5c9a8] rounded" />
            <div className="absolute top-[25%] left-[55%] w-[30%] h-0.5 bg-[#b5c9a8] rounded" />

            {/* Bus markers — driven by SEED_BUSES so always consistent */}
            {SEED_BUSES.map((bus) => (
              <div
                key={bus.id}
                className={`absolute flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white ${STATUS_MARKER_BG[bus.status]}`}
                style={{ top: bus.mapTop, left: bus.mapLeft }}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[bus.status]}`} />
                {bus.id}
              </div>
            ))}

            {/* Live Status panel */}
            <div className="absolute top-3 right-3 bg-white rounded-xl border border-gray-200 p-3 min-w-[150px] shadow-sm">
              <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide mb-2">Live Status</p>
              {(["On Time", "Delayed", "Breakdown"] as BusStatus[]).map((s) => {
                const count = s === "On Time" ? onTime : s === "Delayed" ? delayed : breakdown;
                return (
                  <div key={s} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${LEGEND_DOT[s]}`} />
                      <span className="text-[11px] text-gray-500">{s}</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#122843]">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Map coming soon */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/80 rounded-lg px-4 py-2 text-center border border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Map integration coming soon</p>
              <p className="text-[10px] text-gray-400">GPS tracking will appear here</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-5 px-5 py-3 border-t border-gray-100">
            {(["On Time", "Delayed", "Breakdown"] as BusStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${LEGEND_DOT[s]}`} />
                <span className="text-xs text-gray-500">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex flex-col gap-4">

          {/* Active buses count */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <img src="/icons/fleet.png" className="w-12 h-12 object-contain" alt="buses" />
            <div>
              <p className="text-3xl font-extrabold text-black">{SEED_BUSES.length}</p>
              <p className="text-[#94a0ae] text-sm">Active Buses</p>
            </div>
          </div>

          {/* Bus list — filtered by toolbar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-extrabold text-[#122843]">Active Buses</span>
              <span className="text-xs text-[#94a0ae]">{filtered.length} buses</span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No buses match filters.</p>
              ) : (
                filtered.map((bus) => (
                  <div
                    key={bus.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <img src="/icons/fleet.png" className="w-12 h-12 object-contain flex-shrink-0" alt="bus" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#122843]">{bus.id}</p>
                      <p className="text-xs text-[#94a0ae]">{bus.route}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase whitespace-nowrap ${STATUS_BADGE[bus.status]}`}>
                      {bus.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
