"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  IoEye,
  IoPencil,
  IoSearch,
  IoAddCircle,
  IoCheckmarkCircle,
  IoBan,
} from "react-icons/io5";
import { FiMap, FiCheckCircle, FiTool, FiAlertOctagon } from "react-icons/fi";

// ─── Types ───────────────────────────────────────────────────────────────────
type RouteStatus = "Active" | "Maintenance" | "Breakdown";

type StopItem = {
  id: string;
  stopId: number;
  name: string;
  timeFromStart: string;
};

type ApiStop = {
  id: number;
  stopName: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
};

type Route = {
  id: number;
  routeName: string;
  from: string;
  to: string;
  noOfBuses: number;
  avgTime: string | null;
  stopList: StopItem[];
  isActive: boolean;
  status?: RouteStatus;
};

type FormData = {
  routeName: string;
  from: string;
  to: string;
  noOfBuses: number;
  avgTime: string;
  stopList: StopItem[];
  isActive: boolean;
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rebuildIds(stops: StopItem[]): StopItem[] {
  return stops.map((s, i) => ({ ...s, id: String(i + 1).padStart(2, "0") }));
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(".");
  return parseInt(h || "0") * 60 + parseInt(m || "0");
}

function minutesToReadable(total: number): string {
  if (total <= 0) return "0 min";
  const h = Math.floor(total / 60), m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

const fmtRouteId = (id: number) => `RT${String(id).padStart(4, "0")}`;

const emptyForm = (): FormData => ({
  routeName: "", from: "", to: "",
  noOfBuses: 5, avgTime: "",
  stopList: [], isActive: true,
});

// ─── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Active:      "bg-emerald-100 text-emerald-700",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Breakdown:   "bg-red-100 text-red-600",
  Inactive:    "bg-red-100 text-red-600",
};

const STATUS_DOT: Record<string, string> = {
  Active:      "bg-emerald-500",
  Maintenance: "bg-yellow-400",
  Breakdown:   "bg-red-500",
  Inactive:    "bg-red-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon, bg, value, label, color,
}: {
  icon: React.ReactNode; bg: string; value: number; label: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight ${color}`}>{value}</p>
        <p className="text-sm text-gray-400 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Stop Picker Modal ────────────────────────────────────────────────────────
type PickMode = "start" | "end" | "middle";
type StopPickerResult = { stopList: StopItem[]; from: string; to: string };

function StopPickerModal({
  initialSelected,
  onConfirm,
  onClose,
}: {
  initialSelected: StopItem[];
  initialFrom?: string;
  initialTo?: string;
  onConfirm: (r: StopPickerResult) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<StopItem[]>(initialSelected);
  const [query,    setQuery]    = useState("");
  const [error,    setError]    = useState("");
  const [pickMode, setPickMode] = useState<PickMode>("start");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const [apiStops,     setApiStops]     = useState<ApiStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(true);
  const [stopsError,   setStopsError]   = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStopsLoading(true);
        setStopsError("");
        const { data } = await api.get<{ data: { stops: ApiStop[] } }>("/stops", {
          params: { activeOnly: true, limit: 200 },
        });
        if (!cancelled) setApiStops(data.data.stops ?? []);
      } catch (err: any) {
        if (!cancelled)
          setStopsError(err.response?.data?.message ?? err.message ?? "Failed to load stops");
      } finally {
        if (!cancelled) setStopsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedIds = new Set(selected.map((s) => s.stopId));
    const available = apiStops.filter(
      (p) => !selectedIds.has(p.id) && (q === "" || p.stopName.toLowerCase().includes(q))
    );
    const map: Record<string, ApiStop[]> = {};
    for (const s of available) {
      const zone = s.stopName.includes(",") ? s.stopName.split(",")[1]?.trim() : "All Stops";
      const key = zone || "All Stops";
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [apiStops, selected, query]);

  const startName = selected.length > 0 ? selected[0].name : "";
  const endName   = selected.length > 1 ? selected[selected.length - 1].name : "";

  const handlePickStop = (stop: ApiStop) => {
    const newItem: StopItem = { id: "", stopId: stop.id, name: stop.stopName, timeFromStart: "" };

    if (pickMode === "start") {
      setSelected((prev) => {
        const rest = prev.length > 0 ? prev.slice(1) : [];
        return rebuildIds([{ ...newItem, timeFromStart: "00.00" }, ...rest]);
      });
      setPickMode(selected.length < 2 ? "end" : "middle");
      setQuery(""); return;
    }
    if (pickMode === "end") {
      setSelected((prev) => {
        const rest = prev.length > 1 ? prev.slice(0, prev.length - 1) : prev;
        return rebuildIds([...rest, newItem]);
      });
      setPickMode("middle"); setQuery(""); return;
    }
    setSelected((prev) => {
      if (prev.length >= 2) {
        const last = prev[prev.length - 1];
        return rebuildIds([...prev.slice(0, -1), newItem, last]);
      }
      return rebuildIds([...prev, newItem]);
    });
    setQuery("");
  };

  const removeStop  = (i: number) => setSelected((p) => rebuildIds(p.filter((_, idx) => idx !== i)));
  const updateTime  = (i: number, v: string) =>
    setSelected((p) => p.map((s, idx) => idx === i ? { ...s, timeFromStart: v } : s));
  const resetDrag   = () => { setDragging(null); setDragOver(null); };

  const handleDrop = (target: number) => {
    if (dragging === null || dragging === target) { resetDrag(); return; }
    const last = selected.length - 1;
    if ([dragging, target].some((x) => x === 0 || x === last)) { resetDrag(); return; }
    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragging, 1);
      next.splice(target, 0, moved);
      return rebuildIds(next);
    });
    resetDrag();
  };

  const handleConfirm = () => {
    if (selected.length < 2) { setError("Please set a Start stop and an End stop."); return; }
    for (let i = 0; i < selected.length; i++) {
      if (!/^\d{2}\.\d{2}$/.test(selected[i].timeFromStart)) {
        setError(`Stop ${i + 1} (${selected[i].name}): enter time in HH.MM format`); return;
      }
    }
    setError("");
    onConfirm({ stopList: selected, from: selected[0].name, to: selected[selected.length - 1].name });
  };

  const modeHint: Record<PickMode, string> = {
    start:  "← Click a stop to set as START",
    end:    "← Click a stop to set as END",
    middle: "← Click to add between Start and End",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative flex flex-col max-h-[90vh]">
        <div className="px-7 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <button className="absolute right-4 top-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center font-black text-sm transition" onClick={onClose}>✕</button>
          <h2 className="text-xl font-black text-[#122843] tracking-tight flex items-center gap-2">
            <span className="text-2xl">📍</span> Configure Route Stops
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Set a <span className="font-bold text-[#1a7abf]">Start</span> and{" "}
            <span className="font-bold text-[#0d7a4e]">End</span>, then add stops in between.
            Time format: <span className="font-bold text-gray-600">HH.MM</span>
          </p>
        </div>

        <div className="flex-shrink-0 px-7 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setPickMode(pickMode === "start" ? "middle" : "start")}
              className={["flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                pickMode === "start" ? "border-[#1a7abf] bg-[#eaf6ff] text-[#1a7abf] shadow-sm" : "border-[#b3d9f7] bg-white text-[#1a7abf] hover:bg-[#eaf6ff]"].join(" ")}>
              <span className="w-5 h-5 rounded-full bg-[#1a7abf] text-white text-[10px] font-black flex items-center justify-center">S</span>
              {startName ? <span className="max-w-[120px] truncate">{startName}</span> : <span className="opacity-50">{pickMode === "start" ? "Selecting…" : "Set Start"}</span>}
              {startName && <span className="text-[10px] opacity-40">✎</span>}
            </button>
            <span className="text-gray-300 text-lg flex-shrink-0">→</span>
            {selected.length > 2 && (
              <>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg font-semibold flex-shrink-0">
                  {selected.length - 2} stop{selected.length - 2 > 1 ? "s" : ""} in between
                </span>
                <span className="text-gray-300 text-lg flex-shrink-0">→</span>
              </>
            )}
            <button onClick={() => setPickMode(pickMode === "end" ? "middle" : "end")}
              className={["flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                pickMode === "end" ? "border-[#0d7a4e] bg-[#eafaf2] text-[#0d7a4e] shadow-sm" : "border-[#a7e9cc] bg-white text-[#0d7a4e] hover:bg-[#eafaf2]"].join(" ")}>
              <span className="w-5 h-5 rounded-full bg-[#0d7a4e] text-white text-[10px] font-black flex items-center justify-center">E</span>
              {endName ? <span className="max-w-[120px] truncate">{endName}</span> : <span className="opacity-50">{pickMode === "end" ? "Selecting…" : "Set End"}</span>}
              {endName && <span className="text-[10px] opacity-40">✎</span>}
            </button>
            {startName && endName && (
              <button onClick={() => setPickMode("middle")}
                className={["flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                  pickMode === "middle" ? "border-[#4CAF8A] bg-[#eafff5] text-[#4CAF8A] shadow-sm" : "border-[#c8f0df] bg-white text-[#4CAF8A] hover:bg-[#eafff5]"].join(" ")}>
                <span className="text-base leading-none">+</span> Add Stops
              </button>
            )}
            <span className={`ml-auto text-[11px] font-semibold italic flex-shrink-0 ${pickMode === "start" ? "text-[#1a7abf]" : pickMode === "end" ? "text-[#0d7a4e]" : "text-[#4CAF8A]"}`}>
              {modeHint[pickMode]}
            </span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-60 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <IoSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Search stops..." autoFocus
                  className="flex-1 text-sm bg-transparent outline-none text-black placeholder-gray-400"
                  value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>}
              </div>
              <div className={["mt-2 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5",
                pickMode === "start" ? "bg-[#eaf6ff] text-[#1a7abf]" : pickMode === "end" ? "bg-[#eafaf2] text-[#0d7a4e]" : "bg-[#eafff5] text-[#4CAF8A]"].join(" ")}>
                <span>{pickMode === "start" ? "👆" : pickMode === "end" ? "👇" : "➕"}</span>
                Clicking sets as <span className="uppercase">{pickMode === "middle" ? "middle stop" : pickMode}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {stopsLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-xs">Loading stops…</p>
                </div>
              ) : stopsError ? (
                <p className="text-xs text-red-400 text-center mt-8 px-2">{stopsError}</p>
              ) : Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-300 text-xs mt-8">{query ? "No stops match." : "All stops added."}</p>
              ) : Object.entries(grouped).map(([zone, stops]) => (
                <div key={zone} className="mb-4">
                  <p className="text-[9px] uppercase font-black text-gray-300 tracking-widest mb-1.5 px-1">{zone}</p>
                  <div className="space-y-0.5">
                    {stops.map((stop) => (
                      <button key={stop.id} onClick={() => handlePickStop(stop)}
                        className={["w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition group flex items-center justify-between border border-transparent",
                          pickMode === "start" ? "text-[#1a7abf] hover:bg-[#eaf6ff] hover:border-[#b3d9f7]"
                            : pickMode === "end" ? "text-[#0d7a4e] hover:bg-[#eafaf2] hover:border-[#a7e9cc]"
                            : "text-gray-700 hover:bg-[#4CAF8A]/10 hover:text-[#4CAF8A] hover:border-[#4CAF8A]/30"].join(" ")}>
                        <span>{stop.stopName}</span>
                        <span className={["opacity-0 group-hover:opacity-100 text-sm font-black",
                          pickMode === "start" ? "text-[#1a7abf]" : pickMode === "end" ? "text-[#0d7a4e]" : "text-[#4CAF8A]"].join(" ")}>
                          {pickMode === "start" ? "S" : pickMode === "end" ? "E" : "+"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  Route Stops
                  <span className="ml-2 bg-[#122843] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{selected.length}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Drag middle stops to reorder · Enter time for each</p>
              </div>
              {selected.length > 0 && (
                <button onClick={() => { setSelected([]); setPickMode("start"); }}
                  className="text-[10px] text-red-400 hover:text-red-600 font-bold transition">Clear all</button>
              )}
            </div>
            {error && (
              <div className="mx-5 mb-2 flex-shrink-0 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">⚠️ {error}</div>
            )}
            {selected.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-5 mb-1 flex-shrink-0">
                <div className="col-span-1" />
                <div className="col-span-6 text-[9px] uppercase font-black text-gray-300 tracking-wider">Stop Name</div>
                <div className="col-span-4 text-[9px] uppercase font-black text-gray-300 tracking-wider">Time (HH.MM)</div>
                <div className="col-span-1" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3"><span className="text-2xl">📍</span></div>
                  <p className="text-sm font-semibold text-gray-300">No stops yet</p>
                  <p className="text-xs text-gray-200 mt-1">Set Start and End stops first</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selected.map((stop, index) => {
                    const isStart    = index === 0;
                    const isEnd      = index === selected.length - 1 && selected.length > 1;
                    const isTerminal = isStart || isEnd;
                    const isDragging = dragging === index;
                    const isOver     = dragOver === index && dragging !== index;
                    const hasTimeErr = stop.timeFromStart !== "" && !/^\d{2}\.\d{2}$/.test(stop.timeFromStart);
                    return (
                      <div key={`${stop.stopId}-${index}`}
                        draggable={!isTerminal}
                        onDragStart={() => !isTerminal && setDragging(index)}
                        onDragOver={(e) => { e.preventDefault(); if (!isTerminal) setDragOver(index); }}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={resetDrag}
                        className={["grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded-xl border transition select-none",
                          isTerminal ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                          isStart ? "bg-[#eaf6ff] border-[#b3d9f7]" : "",
                          isEnd   ? "bg-[#eafaf2] border-[#a7e9cc]" : "",
                          isDragging ? "opacity-40 border-[#4CAF8A] bg-[#4CAF8A]/5" : "",
                          isOver  ? "border-[#4CAF8A] bg-[#4CAF8A]/5 scale-[1.01]" : "",
                          !isTerminal && !isDragging && !isOver ? "border-transparent hover:border-gray-200 hover:bg-gray-50" : "",
                        ].join(" ")}>
                        <div className="col-span-1 flex items-center justify-center">
                          <span className={["w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center",
                            isStart ? "bg-[#1a7abf]" : isEnd ? "bg-[#0d7a4e]" : "bg-[#122843]"].join(" ")}>{stop.id}</span>
                        </div>
                        <div className="col-span-6 flex items-center gap-1.5 min-w-0">
                          {!isTerminal && (
                            <svg className="w-3 h-3 text-gray-300 flex-shrink-0" viewBox="0 0 8 14" fill="currentColor">
                              <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                              <circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>
                              <circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>
                            </svg>
                          )}
                          <span className="text-sm font-semibold text-gray-700 truncate">{stop.name}</span>
                          {isStart && <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#b3d9f7] text-[#1a5a8a]">Start</span>}
                          {isEnd   && <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#a7e9cc] text-[#0d5c3a]">End</span>}
                        </div>
                        <div className="col-span-4">
                          <input
                            className={["w-full h-8 border rounded-lg px-2 text-sm outline-none font-mono text-center transition",
                              isStart     ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" : "",
                              isEnd       ? "focus:border-[#0d7a4e] border-[#a7e9cc]" : "",
                              !isTerminal ? "focus:border-[#4CAF8A] border-gray-200" : "",
                              hasTimeErr  ? "border-red-300 bg-red-50" : "",
                            ].join(" ")}
                            placeholder="00.00" value={stop.timeFromStart}
                            onChange={(e) => updateTime(index, e.target.value)}
                            disabled={isStart} maxLength={5}
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {!isTerminal && (
                            <button onClick={() => removeStop(index)}
                              className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 font-bold text-[10px] transition">✕</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-400">{selected.length > 0 ? `${selected.length} stop${selected.length !== 1 ? "s" : ""}` : "No stops selected"}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200 transition">Cancel</button>
            <button onClick={handleConfirm} className="px-8 py-2 rounded-xl bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition active:scale-95">Confirm Stops</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminManageRoutes() {
  const [routes,       setRoutes]       = useState<Route[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "active" | "inactive">("All");

  const [showModal,      setShowModal]      = useState(false);
  const [editingRoute,   setEditingRoute]   = useState<Route | null>(null);
  const [form,           setForm]           = useState<FormData>(emptyForm());
  const [formError,      setFormError]      = useState("");
  const [apiError,       setApiError]       = useState("");
  const [showStopPicker, setShowStopPicker] = useState(false);
  const [viewRoute,      setViewRoute]      = useState<Route | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: { total: number; routes: Route[] } }>("/routes");
      setRoutes(data.data.routes ?? []);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to load routes",
        text: err.response?.data?.message ?? err.message ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalRoutes    = routes.length;
  const activeRoutes   = routes.filter((r) => r.isActive).length;
  const inactiveRoutes = routes.filter((r) => !r.isActive).length;

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = routes.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      fmtRouteId(r.id).toLowerCase().includes(q) ||
      r.routeName.toLowerCase().includes(q) ||
      r.from.toLowerCase().includes(q) ||
      r.to.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "active" ? r.isActive : !r.isActive);
    return matchSearch && matchStatus;
  });

  // ── Stop picker result ────────────────────────────────────────────────────
  const handleStopsConfirmed = ({ stopList, from, to }: StopPickerResult) => {
    const maxMins = Math.max(...stopList.map((s) => timeToMinutes(s.timeFromStart)));
    setForm((prev) => ({ ...prev, stopList, from, to, avgTime: minutesToReadable(maxMins) }));
    setShowStopPicker(false);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError(""); setApiError("");
    if (!form.routeName.trim()) { setFormError("Route Name is required."); return; }
    if (!/^Route\s+\d+$/i.test(form.routeName.trim())) { setFormError("Route Name must be in the format 'Route 138'."); return; }
    if (!Number.isInteger(form.noOfBuses) || form.noOfBuses < 0) { setFormError("No. of Buses must be 0 or a positive whole number."); return; }
    if (form.stopList.length < 2) { setFormError("Please configure stops using the 'Configure Stops' button."); return; }

    const stopListPayload = form.stopList.map((s, idx) => ({
      stopId:       s.stopId,
      stopSequence: idx + 1,
      time:         s.timeFromStart,
    }));

    const payload = {
      routeName: form.routeName,
      from:      form.from,
      to:        form.to,
      noOfBuses: form.noOfBuses,
      avgTime:   form.avgTime || null,
      stopList:  stopListPayload,
      isActive:  form.isActive,
    };

    try {
      if (editingRoute) {
        await api.put(`/routes/${editingRoute.id}`, payload);
        Swal.fire({ icon: "success", title: "Route Updated", timer: 1500, showConfirmButton: false });
      } else {
        await api.post("/routes", payload);
        Swal.fire({ icon: "success", title: "Route Created", timer: 1500, showConfirmButton: false });
      }
      await loadRoutes();
      setShowModal(false);
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? err.message ?? "Save failed");
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = async (route: Route) => {
    const isSuspending = route.isActive;
    const confirm = await Swal.fire({
      title: `${isSuspending ? "Suspend" : "Reactivate"} ${route.routeName}?`,
      text: isSuspending ? "This route will be marked inactive." : "This route will be restored to active.",
      icon: isSuspending ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: isSuspending ? "#ef4444" : "#10b981",
      confirmButtonText: isSuspending ? "Yes, suspend" : "Yes, reactivate",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.patch(`/routes/${route.id}/suspend`);
      await loadRoutes();
      Swal.fire({ icon: "success", title: isSuspending ? "Route suspended" : "Route reactivated", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: err.response?.data?.message ?? err.message ?? "Failed" });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (route: Route) => {
    const confirm = await Swal.fire({
      title: `Delete ${route.routeName}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/routes/${route.id}`);
      await loadRoutes();
      Swal.fire({ icon: "success", title: "Route deleted", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: err.response?.data?.message ?? err.message ?? "Failed" });
    }
  };

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingRoute(null);
    setForm(emptyForm());
    setFormError(""); setApiError("");
    setShowModal(true);
  };

  const openEdit = (route: Route) => {
    setEditingRoute(route);
    setForm({
      routeName: route.routeName,
      from:      route.from,
      to:        route.to,
      noOfBuses: route.noOfBuses,
      avgTime:   route.avgTime ?? "",
      stopList:  route.stopList ?? [],
      isActive:  route.isActive,
    });
    setFormError(""); setApiError("");
    setShowModal(true);
  };

  const labelCls = "block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest";
  const inputCls = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A] transition bg-white";

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-full">

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<FiMap          className="w-6 h-6 text-blue-500"   />} bg="bg-blue-50"   value={totalRoutes}    label="Total Routes"   color="text-blue-600"   />
        <StatCard icon={<FiCheckCircle  className="w-6 h-6 text-emerald-500"/>} bg="bg-emerald-50" value={activeRoutes}   label="Active Routes"  color="text-emerald-600"/>
        <StatCard icon={<FiAlertOctagon className="w-6 h-6 text-red-400"   />} bg="bg-red-50"    value={inactiveRoutes} label="Inactive Routes" color="text-red-500"    />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-72 shadow-sm">
          <IoSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search by ID, name or destination…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <select
          className="h-10 border border-gray-200 rounded-xl px-3 bg-white text-sm text-gray-700 shadow-sm outline-none cursor-pointer"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button onClick={openAdd}
          className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2">
          <IoAddCircle className="w-4 h-4" />
          Add Route
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="responsive-table">
          <div className="min-w-max grid grid-cols-[100px_140px_240px_80px_80px_110px_110px_116px] bg-[#f8fafc] px-5 py-3 text-[11px] font-black text-gray-500 border-b uppercase tracking-widest">
          <div>Route ID</div><div>Name</div><div>From → To</div><div>Stops</div>
          <div>Buses</div><div>Avg Time</div><div>Status</div><div className="text-center">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-semibold">Loading routes…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
            <FiMap className="w-8 h-8 opacity-30" />
            <p className="text-sm font-semibold">No routes found.</p>
          </div>
        ) : (
          filtered.map((route, idx) => {
            const displayStatus = route.isActive ? "Active" : "Inactive";
            return (
              <div key={route.id}
                className={`grid grid-cols-[100px_140px_240px_80px_80px_110px_110px_116px] items-center px-5 py-3.5 border-b transition-colors duration-150 ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                } hover:bg-blue-50/30`}>
                <div className="font-mono text-[11px] font-bold text-gray-400 tracking-wider">{fmtRouteId(route.id)}</div>
                <div className="font-semibold text-gray-800 text-[13px] truncate pr-2">{route.routeName}</div>
                <div className="text-xs pr-3">
                  <span className="font-semibold text-gray-700">{route.from}</span>
                  <span className="mx-1.5 text-gray-300">→</span>
                  <span className="font-semibold text-gray-700">{route.to}</span>
                </div>
                <div className="text-gray-600 text-sm font-medium">{route.stopList?.length ?? 0}</div>
                <div className="text-gray-600 text-sm font-medium">{route.noOfBuses}</div>
                <div className="text-gray-500 text-xs font-medium">{route.avgTime ?? "—"}</div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[displayStatus]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[displayStatus]}`} />
                    {displayStatus}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button onClick={() => setViewRoute(route)} title="View"
                    className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 flex items-center justify-center transition-all active:scale-90">
                    <IoEye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(route)} title="Edit"
                    className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 flex items-center justify-center transition-all active:scale-90">
                    <IoPencil className="w-3.5 h-3.5" />
                  </button>
                  {route.isActive ? (
                    <button onClick={() => handleToggleActive(route)} title="Suspend"
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all active:scale-90">
                      <IoBan className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleToggleActive(route)} title="Reactivate"
                      className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 flex items-center justify-center transition-all active:scale-90">
                      <IoCheckmarkCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm">✕</button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-[#122843] tracking-tight">
                {editingRoute ? "Edit Route" : "Add New Route"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {editingRoute ? `Editing — ${fmtRouteId(editingRoute.id)}` : "Register a new bus route"}
              </p>
            </div>

            {(formError || apiError) && (
              <div className="mb-5 flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
                <span className="mt-0.5">⚠</span>
                <span>{formError || apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Route Name</label>
                <input className={inputCls} placeholder="e.g. Route 138"
                  value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>No. of Buses</label>
                <input type="number" min={0} step={1} className={inputCls}
                  value={form.noOfBuses} onChange={(e) => setForm({ ...form, noOfBuses: Math.floor(Number(e.target.value)) })} />
              </div>
              <div>
                <label className={labelCls}>From <span className="normal-case font-medium text-gray-300">(set in stops)</span></label>
                <div className={`w-full h-10 border border-dashed rounded-lg px-3 text-sm flex items-center bg-gray-50 ${form.from ? "border-[#b3d9f7] text-[#1a7abf] font-semibold" : "border-gray-300 text-gray-400"}`}>
                  {form.from || "—"}
                </div>
              </div>
              <div>
                <label className={labelCls}>To <span className="normal-case font-medium text-gray-300">(set in stops)</span></label>
                <div className={`w-full h-10 border border-dashed rounded-lg px-3 text-sm flex items-center bg-gray-50 ${form.to ? "border-[#a7e9cc] text-[#0d7a4e] font-semibold" : "border-gray-300 text-gray-400"}`}>
                  {form.to || "—"}
                </div>
              </div>
              <div>
                <label className={labelCls}>Stops <span className="normal-case font-medium text-gray-300">(auto)</span></label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {form.stopList.length > 0 ? `${form.stopList.length} stops` : "—"}
                </div>
              </div>
              <div>
                <label className={labelCls}>Avg Time <span className="normal-case font-medium text-gray-300">(auto)</span></label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {form.avgTime || "—"}
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Status</label>
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button key={String(val)} onClick={() => setForm({ ...form, isActive: val })}
                      className={`flex-1 h-10 rounded-lg border-2 text-sm font-bold transition ${
                        form.isActive === val
                          ? val ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600"
                          : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                      }`}>
                      {val ? "Active" : "Inactive"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setShowStopPicker(true)}
              className="mt-4 w-full h-11 border-2 border-dashed border-[#4CAF8A] rounded-xl text-[#4CAF8A] font-bold text-sm hover:bg-[#4CAF8A]/5 transition flex items-center justify-center gap-2">
              <span className="text-lg leading-none">📍</span>
              {form.stopList.length > 0 ? `Edit Stops  ·  ${form.stopList.length} stops configured` : "Configure Stops"}
            </button>

            <div className="mt-7 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleSave}
                className="px-8 py-2 rounded-xl bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition active:scale-95">
                {editingRoute ? "Save Changes" : "Create Route"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOP PICKER */}
      {showStopPicker && (
        <StopPickerModal
          initialSelected={form.stopList}
          initialFrom={form.from}
          initialTo={form.to}
          onConfirm={handleStopsConfirmed}
          onClose={() => setShowStopPicker(false)}
        />
      )}

      {/* VIEW MODAL */}
      {viewRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl p-7 relative">
            <button onClick={() => setViewRoute(null)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm">✕</button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#122843] flex items-center justify-center text-white text-xl shadow-md ring-4 ring-white flex-shrink-0">
                <FiMap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#122843] tracking-tight">{viewRoute.routeName}</h2>
                <p className="text-[11px] text-gray-400 font-mono font-bold tracking-widest mt-0.5">{fmtRouteId(viewRoute.id)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-gray-50/80 p-5 rounded-xl border border-gray-100">
              {[
                ["From",     viewRoute.from],
                ["To",       viewRoute.to],
                ["Avg Time", viewRoute.avgTime ?? "—"],
                ["Buses",    `${viewRoute.noOfBuses} buses`],
                ["Stops",    `${viewRoute.stopList?.length ?? 0} stops`],
                ["Status",   viewRoute.isActive ? "Active" : "Inactive"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-0.5 tracking-widest">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm break-all leading-snug">{val}</p>
                </div>
              ))}
              {viewRoute.stopList?.length > 0 && (
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">Stop Details</p>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {viewRoute.stopList.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#122843] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{s.id}</span>
                        <span className="flex-1 text-gray-700 font-medium">{s.name}</span>
                        <span className="text-gray-400 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.timeFromStart}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewRoute(null)}
                className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl hover:bg-[#1a3a5c] transition active:scale-95">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}