"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  IoEye,
  IoPencil,
  IoSearch,
  IoAddCircle,
  IoCheckmarkCircle,
  IoBan,
} from "react-icons/io5";
import { FiMap, FiCheckCircle, FiAlertOctagon } from "react-icons/fi";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { MdVerified } from "react-icons/md";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── API helper ───────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Request failed");
  return json.data as T;
}

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

// ─── ID search parser ─────────────────────────────────────────────────────────
// Handles: "RT0001", "RT1", plain digits "0001" / "1" → ?id=
// Everything else → ?search=
function parseIdSearch(raw: string): { idQuery: string; textQuery: string } {
  const trimmed = raw.trim().toUpperCase();

  const prefixMatch = trimmed.match(/^RT(\d+)$/);
  if (prefixMatch) {
    return { idQuery: String(parseInt(prefixMatch[1], 10)), textQuery: "" };
  }

  if (/^\d+$/.test(trimmed)) {
    return { idQuery: String(parseInt(trimmed, 10)), textQuery: "" };
  }

  return { idQuery: "", textQuery: raw.trim() };
}

const emptyForm = (): FormData => ({
  routeName: "", from: "", to: "",
  noOfBuses: 5, avgTime: "",
  stopList: [], isActive: true,
});

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon, bg, value, label, color,
}: {
  icon: React.ReactNode; bg: string; value: number; label: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  open, title, message, confirmLabel, confirmClass, onCancel, onConfirm,
}: {
  open: boolean; title: string; message: string;
  confirmLabel: string; confirmClass: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-lg font-bold text-gray-800">{title}</h3>
        <p className="mb-5 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Input / label styles ─────────────────────────────────────────────────────
const inputBase = "w-full h-10 border rounded-md px-2 text-sm outline-none transition bg-white";
const inputNormal = `${inputBase} border-[#828282]/70 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const labelCls = "block mb-2 font-semibold text-sm text-gray-700";

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
        const res = await apiFetch<{ stops: ApiStop[] }>("/stops?activeOnly=true&limit=200");
        if (!cancelled) setApiStops(res.stops ?? []);
      } catch (err) {
        if (!cancelled) setStopsError(err instanceof Error ? err.message : "Failed to load stops");
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

  const removeStop = (i: number) => setSelected((p) => rebuildIds(p.filter((_, idx) => idx !== i)));
  const updateTime = (i: number, v: string) =>
    setSelected((p) => p.map((s, idx) => idx === i ? { ...s, timeFromStart: v } : s));
  const resetDrag = () => { setDragging(null); setDragOver(null); };

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 relative flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📍</span> Configure Route Stops
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Set a <span className="font-bold text-[#1a7abf]">Start</span> and{" "}
            <span className="font-bold text-[#0d7a4e]">End</span>, then add stops in between.
            Time format: <span className="font-bold text-gray-600">HH.MM</span>
          </p>
        </div>

        {/* Mode bar */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setPickMode(pickMode === "start" ? "middle" : "start")}
              className={["flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                pickMode === "start" ? "border-[#1a7abf] bg-[#eaf6ff] text-[#1a7abf]" : "border-[#b3d9f7] bg-white text-[#1a7abf] hover:bg-[#eaf6ff]"].join(" ")}>
              <span className="w-5 h-5 rounded-full bg-[#1a7abf] text-white text-[10px] font-black flex items-center justify-center">S</span>
              {startName ? <span className="max-w-[120px] truncate">{startName}</span> : <span className="opacity-50">{pickMode === "start" ? "Selecting…" : "Set Start"}</span>}
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
                pickMode === "end" ? "border-[#0d7a4e] bg-[#eafaf2] text-[#0d7a4e]" : "border-[#a7e9cc] bg-white text-[#0d7a4e] hover:bg-[#eafaf2]"].join(" ")}>
              <span className="w-5 h-5 rounded-full bg-[#0d7a4e] text-white text-[10px] font-black flex items-center justify-center">E</span>
              {endName ? <span className="max-w-[120px] truncate">{endName}</span> : <span className="opacity-50">{pickMode === "end" ? "Selecting…" : "Set End"}</span>}
            </button>
            {startName && endName && (
              <button onClick={() => setPickMode("middle")}
                className={["flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                  pickMode === "middle" ? "border-[#4CAF8A] bg-[#eafff5] text-[#4CAF8A]" : "border-[#c8f0df] bg-white text-[#4CAF8A] hover:bg-[#eafff5]"].join(" ")}>
                <span>+</span> Add Stops
              </button>
            )}
            <span className={`ml-auto text-[11px] font-semibold italic flex-shrink-0 ${pickMode === "start" ? "text-[#1a7abf]" : pickMode === "end" ? "text-[#0d7a4e]" : "text-[#4CAF8A]"}`}>
              {modeHint[pickMode]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Stop list panel */}
          <div className="w-56 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2">
                <IoSearch className="w-4 h-4 opacity-50" />
                <input type="text" placeholder="Search stops..." autoFocus
                  className="flex-1 text-sm bg-transparent outline-none text-black"
                  value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {stopsLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">Loading stops…</div>
              ) : stopsError ? (
                <p className="text-xs text-red-400 text-center mt-8 px-2">{stopsError}</p>
              ) : Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-300 text-xs mt-8">{query ? "No stops match." : "All stops added."}</p>
              ) : Object.entries(grouped).map(([zone, stops]) => (
                <div key={zone} className="mb-4">
                  <p className="text-[9px] uppercase font-bold text-gray-300 tracking-widest mb-1 px-1">{zone}</p>
                  <div className="space-y-0.5">
                    {stops.map((stop) => (
                      <button key={stop.id} onClick={() => handlePickStop(stop)}
                        className={["w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition group flex items-center justify-between border border-transparent",
                          pickMode === "start" ? "text-[#1a7abf] hover:bg-[#eaf6ff] hover:border-[#b3d9f7]"
                            : pickMode === "end" ? "text-[#0d7a4e] hover:bg-[#eafaf2] hover:border-[#a7e9cc]"
                            : "text-gray-700 hover:bg-[#4CAF8A]/10 hover:text-[#4CAF8A]"].join(" ")}>
                        <span className="truncate">{stop.stopName}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-sm font-black ml-1 flex-shrink-0">
                          {pickMode === "start" ? "S" : pickMode === "end" ? "E" : "+"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected stops panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Route Stops
                <span className="ml-2 bg-[#122843] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{selected.length}</span>
              </p>
              {selected.length > 0 && (
                <button onClick={() => { setSelected([]); setPickMode("start"); }}
                  className="text-[10px] text-red-400 hover:text-red-600 font-bold">Clear all</button>
              )}
            </div>
            {error && (
              <div className="mx-5 mb-2 flex-shrink-0 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-md border border-red-100">⚠️ {error}</div>
            )}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm font-semibold text-gray-300">No stops yet</p>
                  <p className="text-xs text-gray-200 mt-1">Set Start and End first</p>
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
                          isEnd ? "bg-[#eafaf2] border-[#a7e9cc]" : "",
                          isDragging ? "opacity-40 border-[#4CAF8A] bg-[#4CAF8A]/5" : "",
                          isOver ? "border-[#4CAF8A] bg-[#4CAF8A]/5 scale-[1.01]" : "",
                          !isTerminal && !isDragging && !isOver ? "border-transparent hover:border-gray-200 hover:bg-gray-50" : "",
                        ].join(" ")}>
                        <div className="col-span-1 flex items-center justify-center">
                          <span className={["w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center",
                            isStart ? "bg-[#1a7abf]" : isEnd ? "bg-[#0d7a4e]" : "bg-[#122843]"].join(" ")}>{stop.id}</span>
                        </div>
                        <div className="col-span-6 flex items-center gap-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-700 truncate">{stop.name}</span>
                          {isStart && <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#b3d9f7] text-[#1a5a8a]">Start</span>}
                          {isEnd   && <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#a7e9cc] text-[#0d5c3a]">End</span>}
                        </div>
                        <div className="col-span-4">
                          <input
                            className={["w-full h-8 border rounded-lg px-2 text-sm outline-none font-mono text-center transition",
                              isStart ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" : "focus:border-[#4CAF8A] border-gray-200",
                              hasTimeErr ? "border-red-300 bg-red-50" : "",
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-lg flex-shrink-0">
          <p className="text-xs text-gray-400">{selected.length > 0 ? `${selected.length} stop${selected.length !== 1 ? "s" : ""}` : "No stops selected"}</p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="rounded-md bg-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400 transition">
              Cancel
            </button>
            <button onClick={handleConfirm}
              className="rounded-xl bg-[#f5a623] hover:bg-[#e09510] px-8 py-2 text-sm font-bold text-white shadow-md transition active:scale-95">
              Confirm Stops
            </button>
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
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page,        setPage]        = useState(1);
  const [limit,       setLimit]       = useState(10);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);

  // ── Stats (derived from a dedicated endpoint) ──────────────────────────────
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const [showModal,      setShowModal]      = useState(false);
  const [editingRoute,   setEditingRoute]   = useState<Route | null>(null);
  const [form,           setForm]           = useState<FormData>(emptyForm());
  const [formError,      setFormError]      = useState("");
  const [apiError,       setApiError]       = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [showStopPicker, setShowStopPicker] = useState(false);
  const [viewRoute,      setViewRoute]      = useState<Route | null>(null);

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string;
    confirmLabel: string; confirmClass: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmLabel: "", confirmClass: "", onConfirm: () => {} });

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch<{ total: number; routes: Route[] }>("/routes?limit=9999");
      const all = res.routes ?? [];
      setStats({
        total:    res.total ?? all.length,
        active:   all.filter((r) => r.isActive).length,
        inactive: all.filter((r) => !r.isActive).length,
      });
    } catch { /* non-critical */ }
  }, []);

  // ── Load routes — server-side search + status filter + pagination ──────────
  const loadRoutes = useCallback(async (opts?: { search?: string; signal?: AbortSignal }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // ── Smart ID / text search ─────────────────────────────────────────────
      // "RT0001", "RT1", "1", "0001" → ?id=   |   anything else → ?search=
      if (opts?.search) {
        const { idQuery, textQuery } = parseIdSearch(opts.search);
        if (idQuery)   params.set("id",     idQuery);
        if (textQuery) params.set("search", textQuery);
      }

      if (statusFilter) params.set("status", statusFilter);
      params.set("page",  String(page));
      params.set("limit", String(limit));

      const res = await apiFetch<{ total: number; totalPages: number; routes: Route[] }>(
        `/routes?${params.toString()}`,
        { signal: opts?.signal }
      );

      setRoutes(res.routes ?? []);
      setTotalRoutes(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (err) {
      const isAbort = (err as any)?.name === "AbortError";
      if (!isAbort)
        toast.error(err instanceof Error ? err.message : "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadRoutes({ search: search.trim() || undefined, signal: controller.signal });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, loadRoutes]);

  // Reset to page 1 on search / filter change
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const safePage = Math.min(page, Math.max(1, totalPages));

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
      stopId: s.stopId, stopSequence: idx + 1, time: s.timeFromStart,
    }));
    const payload = {
      routeName: form.routeName, from: form.from, to: form.to,
      noOfBuses: form.noOfBuses, avgTime: form.avgTime || null,
      stopList: stopListPayload, isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (editingRoute) {
        await apiFetch(`/routes/${editingRoute.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Route updated successfully");
      } else {
        await apiFetch("/routes", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Route created successfully");
      }
      await loadRoutes({ search: search.trim() || undefined });
      await loadStats();
      setShowModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = (route: Route) => {
    const isSuspending = route.isActive;
    setConfirmState({
      open: true,
      title: `${isSuspending ? "Suspend" : "Reactivate"} ${route.routeName}?`,
      message: isSuspending ? "This route will be marked inactive." : "This route will be restored to active.",
      confirmLabel: isSuspending ? "Yes, suspend" : "Yes, reactivate",
      confirmClass: isSuspending ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await apiFetch(`/routes/${route.id}/suspend`, { method: "PATCH" });
          await loadRoutes({ search: search.trim() || undefined });
          await loadStats();
          toast.success(isSuspending ? "Route suspended" : "Route reactivated");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        }
      },
    });
  };

  // ── Open modals ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingRoute(null);
    setForm(emptyForm());
    setFormError(""); setApiError("");
    setShowModal(true);
  };

  const openEdit = (route: Route) => {
    setEditingRoute(route);
    setForm({
      routeName: route.routeName, from: route.from, to: route.to,
      noOfBuses: route.noOfBuses, avgTime: route.avgTime ?? "",
      stopList: route.stopList ?? [], isActive: route.isActive,
    });
    setFormError(""); setApiError("");
    setShowModal(true);
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <section className="p-6">

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<FiMap          className="w-5 h-5 text-blue-500"    />} bg="bg-blue-50"    value={stats.total}    label="Total Routes"    color="text-blue-600"    />
          <StatCard icon={<FiCheckCircle  className="w-5 h-5 text-emerald-500" />} bg="bg-emerald-50" value={stats.active}   label="Active Routes"   color="text-emerald-600" />
          <StatCard icon={<FiAlertOctagon className="w-5 h-5 text-red-400"    />} bg="bg-red-50"     value={stats.inactive} label="Inactive Routes"  color="text-red-500"     />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="rounded-xl border border-gray-100 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
              <FaMagnifyingGlass className="w-4 h-4 opacity-50" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search name, destination or RT0001…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-black"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600" aria-label="Clear search">
                  <FaXmark className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={openAdd}
              className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
            >
              <IoAddCircle className="w-4 h-4" />
              Add Route
            </button>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-max md:min-w-full">

              {/* Header */}
              <div className="grid grid-cols-[100px_140px_240px_70px_70px_100px_100px_116px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
                <div>Route ID</div>
                <div>Name</div>
                <div>From → To</div>
                <div>Stops</div>
                <div>Buses</div>
                <div>Avg Time</div>
                <div>Status</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading routes...</div>
              ) : routes.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  {search
                    ? `No routes found for "${search}"`
                    : statusFilter
                    ? `No ${statusFilter} routes found`
                    : "No routes found"}
                </div>
              ) : (
                routes.map((route) => {
                  const displayStatus = route.isActive ? "Active" : "Inactive";
                  return (
                    <div key={route.id}
                      className="grid grid-cols-[100px_140px_240px_70px_70px_100px_100px_116px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">

                      <div className="font-semibold text-[#122843] whitespace-nowrap">{fmtRouteId(route.id)}</div>

                      <div className="font-medium text-gray-800 truncate pr-2 text-sm">{route.routeName}</div>

                      <div className="text-sm pr-3">
                        <span className="font-medium text-gray-700">{route.from}</span>
                        <span className="mx-1.5 text-gray-300">→</span>
                        <span className="font-medium text-gray-700">{route.to}</span>
                      </div>

                      <div className="text-gray-600 text-sm">{route.stopList?.length ?? 0}</div>
                      <div className="text-gray-600 text-sm">{route.noOfBuses}</div>
                      <div className="text-gray-600 text-sm">{route.avgTime ?? "—"}</div>

                      <div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                          route.isActive ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                        }`}>
                          {displayStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setViewRoute(route)} title="View"
                          className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition">
                          <IoEye className="text-blue-600 w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(route)} title="Edit"
                          className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition">
                          <IoPencil className="text-amber-500 w-3.5 h-3.5" />
                        </button>
                        {route.isActive ? (
                          <button onClick={() => handleToggleActive(route)} title="Suspend"
                            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition">
                            <IoBan className="text-red-400 w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleToggleActive(route)} title="Reactivate"
                            className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 shadow-sm transition">
                            <IoCheckmarkCircle className="text-emerald-500 w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── PAGINATION ── */}
        {!loading && totalRoutes > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">
              Showing {(safePage - 1) * limit + 1} to {Math.min(safePage * limit, totalRoutes)} of {totalRoutes} routes
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`min-w-9 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      pageNumber === safePage
                        ? "bg-[#4CAF8A] text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={safePage >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <h3 className="mb-1 text-lg font-bold text-gray-800">
              {editingRoute ? "Edit Route" : "Add New Route"}
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {editingRoute ? `Editing — ${fmtRouteId(editingRoute.id)}` : "Register a new bus route"}
            </p>
            <p className="mb-4 text-xs text-gray-500">
              Fields marked with <span className="text-red-600">*</span> are mandatory.
            </p>

            {(formError || apiError) && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <span className="mt-0.5">⚠</span>
                <span>{formError || apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">

              <div>
                <label className={labelCls}>Route Name <span className="text-red-600">*</span></label>
                <input className={inputNormal} placeholder="e.g. Route 138"
                  value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} />
              </div>

              <div>
                <label className={labelCls}>No. of Buses <span className="text-red-600">*</span></label>
                <input type="number" min={0} step={1} className={inputNormal}
                  value={form.noOfBuses}
                  onChange={(e) => setForm({ ...form, noOfBuses: Math.floor(Number(e.target.value)) })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>From <span className="text-gray-400 font-normal">(auto)</span></label>
                  <div className={`w-full h-10 border border-dashed rounded-md px-2 text-sm flex items-center bg-gray-50 ${form.from ? "border-[#b3d9f7] text-[#1a7abf] font-semibold" : "border-gray-300 text-gray-400"}`}>
                    {form.from || "—"}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>To <span className="text-gray-400 font-normal">(auto)</span></label>
                  <div className={`w-full h-10 border border-dashed rounded-md px-2 text-sm flex items-center bg-gray-50 ${form.to ? "border-[#a7e9cc] text-[#0d7a4e] font-semibold" : "border-gray-300 text-gray-400"}`}>
                    {form.to || "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Stops <span className="text-gray-400 font-normal">(auto)</span></label>
                  <div className="w-full h-10 border border-dashed border-gray-300 rounded-md px-2 text-sm flex items-center text-gray-500 bg-gray-50">
                    {form.stopList.length > 0 ? `${form.stopList.length} stops` : "—"}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Avg Time <span className="text-gray-400 font-normal">(auto)</span></label>
                  <div className="w-full h-10 border border-dashed border-gray-300 rounded-md px-2 text-sm flex items-center text-gray-500 bg-gray-50">
                    {form.avgTime || "—"}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button" onClick={() => setForm({ ...form, isActive: val })}
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

              <button type="button" onClick={() => setShowStopPicker(true)}
                className="w-full h-11 border-2 border-dashed border-[#4CAF8A] rounded-xl text-[#4CAF8A] font-bold text-sm hover:bg-[#4CAF8A]/5 transition flex items-center justify-center gap-2">
                <span>📍</span>
                {form.stopList.length > 0 ? `Edit Stops · ${form.stopList.length} stops configured` : "Configure Stops *"}
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)}
                className="rounded-md bg-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400 transition">
                Cancel
              </button>
              <button type="button" disabled={submitting} onClick={handleSave}
                className="rounded-xl bg-[#f5a623] hover:bg-[#e09510] px-8 py-2 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-gray-400 active:scale-95">
                {submitting ? "Saving..." : editingRoute ? "Save Changes" : "Create Route"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STOP PICKER ── */}
      {showStopPicker && (
        <StopPickerModal
          initialSelected={form.stopList}
          initialFrom={form.from}
          initialTo={form.to}
          onConfirm={handleStopsConfirmed}
          onClose={() => setShowStopPicker(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <h3 className="mb-5 text-lg font-bold text-gray-800">Route Details</h3>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-md">
                <FiMap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[#122843]">{viewRoute.routeName}</h2>
                  {viewRoute.isActive && <MdVerified className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">{fmtRouteId(viewRoute.id)}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700 mb-4">
              <p><strong>Route ID:</strong> {fmtRouteId(viewRoute.id)}</p>
              <p><strong>From:</strong> {viewRoute.from}</p>
              <p><strong>To:</strong> {viewRoute.to}</p>
              <p><strong>No. of Buses:</strong> {viewRoute.noOfBuses}</p>
              <p><strong>Avg Time:</strong> {viewRoute.avgTime ?? "—"}</p>
              <p><strong>Stops:</strong> {viewRoute.stopList?.length ?? 0}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${viewRoute.isActive ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                  {viewRoute.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            {viewRoute.stopList?.length > 0 && (
              <div className="mt-4 rounded-md bg-gray-100 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Stop Details</p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {viewRoute.stopList.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#122843] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{s.id}</span>
                      <span className="flex-1 text-gray-700 font-medium">{s.name}</span>
                      <span className="text-gray-400 font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-200">{s.timeFromStart}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button onClick={() => setViewRoute(null)}
                className="rounded-lg bg-[#4CAF8A] px-8 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#3d9e7a] transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        confirmClass={confirmState.confirmClass}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={confirmState.onConfirm}
      />
    </>
  );
}