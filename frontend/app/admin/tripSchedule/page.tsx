"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { CgClose } from "react-icons/cg";
import { IoEye, IoSearch, IoAddCircle } from "react-icons/io5";
import { IoPencil } from "react-icons/io5";
import { FaToggleOn } from "react-icons/fa6";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdDirectionsBus, MdSchedule } from "react-icons/md";

// ─── Types ────────────────────────────────────────────────────────────────────
type TripStatus = "active" | "scheduled" | "delayed" | "completed" | "cancelled";
type Direction = "forward" | "return";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof ALL_DAYS)[number];

type Trip = {
  id: number;
  routeId: number;
  busId: number;
  direction: Direction;
  departureTime: string;
  arrivalTime: string;
  duration: string | null;
  days: Day[];
  status: TripStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  route?: { id: number; routeName: string; from: string; to: string } | null;
  bus?: { id: number; registrationNumber: string; busType: string } | null;
};

type Route = { id: number; routeName: string; from: string; to: string };
type Bus = { id: number; registrationNumber: string; busType: string };

// ─── Axios instance ───────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<TripStatus, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  delayed:   "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_DOT: Record<TripStatus, string> = {
  active:    "bg-emerald-500",
  scheduled: "bg-blue-500",
  delayed:   "bg-yellow-400",
  completed: "bg-gray-400",
  cancelled: "bg-red-500",
};

const STATUS_OPTIONS: TripStatus[] = ["active", "scheduled", "delayed", "completed", "cancelled"];

function displayDuration(trip: Trip): string {
  if (trip.duration) return trip.duration;
  return calcDuration(trip.departureTime, trip.arrivalTime);
}

function calcDuration(dep: string, arr: string): string {
  if (!dep || !arr) return "—";
  const [dh, dm] = dep.slice(0, 5).split(":").map(Number);
  const [ah, am] = arr.slice(0, 5).split(":").map(Number);
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins <= 0) mins += 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtTime(t: string | null): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

function fmtDays(days: Day[]): string {
  if (!days || days.length === 0) return "—";
  if (days.length === 7) return "Daily";
  if (JSON.stringify(days) === JSON.stringify(["Mon","Tue","Wed","Thu","Fri"])) return "Mon–Fri";
  if (JSON.stringify(days) === JSON.stringify(["Mon","Tue","Wed","Thu","Fri","Sat"])) return "Mon–Sat";
  if (JSON.stringify(days) === JSON.stringify(["Sat","Sun"])) return "Weekends";
  return days.join(", ");
}

function StatCard({
  icon, bg, value, label, color,
}: {
  icon: React.ReactNode; bg: string; value: number; label: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight ${color}`}>{value}</p>
        <p className="text-sm text-gray-400 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

type FormData = {
  routeId: number | null;
  busId: number | null;
  direction: Direction;
  departureTime: string;
  arrivalTime: string;
  days: Day[];
  status: TripStatus;
};

const emptyForm = (): FormData => ({
  routeId: null,
  busId: null,
  direction: "forward",
  departureTime: "",
  arrivalTime: "",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  status: "active",
});

const inputCls = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A] transition bg-white text-black";
const labelCls = "block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest";

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminManageTrips() {
  const [trips,        setTrips]        = useState<Trip[]>([]);
  const [routes,       setRoutes]       = useState<Route[]>([]);
  const [buses,        setBuses]        = useState<Bus[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [routesLoading,setRoutesLoading]= useState(false);
  const [busesLoading, setBusesLoading] = useState(false);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "All">("All");
  const [dirFilter,    setDirFilter]    = useState<Direction | "All">("All");

  const [showModal,   setShowModal]   = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form,        setForm]        = useState<FormData>(emptyForm());
  const [formError,   setFormError]   = useState("");
  const [apiError,    setApiError]    = useState("");
  const [viewTrip,    setViewTrip]    = useState<Trip | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const totalTrips     = trips.length;
  const activeNow      = trips.filter((t) => t.isActive).length;
  const delayedTrips   = trips.filter((t) => t.status === "delayed").length;
  const deactivatedTrips = trips.filter((t) => !t.isActive).length;

  // ── Load trips ─────────────────────────────────────────────────────────────
  const loadTrips = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const { data } = await api.get<{ data: { trips: Trip[]; total: number } }>("/trips", {
        params: { limit: 200 },
      });
      const nextTrips = data.data.trips ?? [];
      setTrips(nextTrips);
      setViewTrip((prev) => {
        if (!prev) return prev;
        return nextTrips.find((trip) => trip.id === prev.id) ?? prev;
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to load trips",
        text: err.response?.data?.message ?? err.message ?? "Unknown error",
      });
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  // ── Load routes ────────────────────────────────────────────────────────────
  const loadRoutes = useCallback(async () => {
    setRoutesLoading(true);
    try {
      const { data } = await api.get<{ data: { routes: Route[] } }>("/routes", {
        params: { limit: 200 },
      });
      setRoutes(data.data.routes ?? []);
    } catch {
      // non-critical
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  // ── Load buses ─────────────────────────────────────────────────────────────
  const loadBuses = useCallback(async () => {
    setBusesLoading(true);
    try {
      const { data } = await api.get<{ data: { buses: Bus[] } }>("/buses", {
        params: { limit: 200 },
      });
      setBuses(data.data.buses ?? []);
    } catch {
      // non-critical
    } finally {
      setBusesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
    loadRoutes();
    loadBuses();
  }, [loadTrips, loadRoutes, loadBuses]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => trips.filter((t) => {
    const q = search.toLowerCase();
    const routeName = t.route?.routeName ?? "";
    const busPlate  = t.bus?.registrationNumber ?? "";
    const matchSearch =
      `TR-${String(t.id).padStart(3, "0")}`.toLowerCase().includes(q) ||
      routeName.toLowerCase().includes(q) ||
      busPlate.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchDir    = dirFilter === "All"    || t.direction === dirFilter;
    return matchSearch && matchStatus && matchDir;
  }), [trips, search, statusFilter, dirFilter]);

  // ── Open modals ────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingTrip(null);
    setForm(emptyForm());
    setFormError("");
    setApiError("");
    setShowModal(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setForm({
      routeId:       trip.routeId,
      busId:         trip.busId,
      direction:     trip.direction,
      departureTime: fmtTime(trip.departureTime),
      arrivalTime:   fmtTime(trip.arrivalTime),
      days:          trip.days ?? [],
      status:        trip.status,
    });
    setFormError("");
    setApiError("");
    setShowModal(true);
  };

  const toggleDay = (day: Day) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError(""); setApiError("");

    if (!form.routeId)          { setFormError("Please select a route."); return; }
    if (!form.busId)            { setFormError("Please select a bus."); return; }
    if (!form.departureTime)    { setFormError("Departure time is required."); return; }
    if (!form.arrivalTime)      { setFormError("Arrival time is required."); return; }
    if (form.days.length === 0) { setFormError("Select at least one operating day."); return; }

    const payload = {
      routeId:       form.routeId,
      busId:         form.busId,
      direction:     form.direction,
      departureTime: form.departureTime,
      arrivalTime:   form.arrivalTime,
      days:          form.days,
      status:        editingTrip?.status ?? "active",
    };

    try {
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, payload);
        Swal.fire({ icon: "success", title: "Trip Updated", timer: 1500, showConfirmButton: false });
      } else {
        await api.post("/trips", payload);
        Swal.fire({ icon: "success", title: "Trip Created", timer: 1500, showConfirmButton: false });
      }
      await loadTrips();
      setShowModal(false);
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? err.message ?? "Save failed");
    }
  };

  // ── Update status inline ───────────────────────────────────────────────────
  const handleStatusChange = async (trip: Trip, status: TripStatus) => {
    try {
      await api.patch(`/trips/${trip.id}/status`, { status });
      setTrips((prev) => prev.map((t) => t.id === trip.id ? { ...t, status } : t));
    } catch (err: any) {
      Swal.fire({ icon: "error", title: err.response?.data?.message ?? err.message ?? "Failed" });
    }
  };

  const handleToggleActive = async (trip: Trip) => {
    const nextIsActive = !trip.isActive;

    setStatusUpdatingId(trip.id);
    try {
      await api.patch(`/trips/${trip.id}/toggle`);
      await loadTrips({ silent: true });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: err.response?.data?.message ?? err.message ?? "Failed" });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-full">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<MdDirectionsBus className="w-6 h-6 text-blue-500" />}
          bg="bg-blue-50" value={totalTrips} label="Total Trips" color="text-blue-600" />
        <StatCard
          icon={<FaCheckCircle className="w-6 h-6 text-emerald-500" />}
          bg="bg-emerald-50" value={activeNow} label="Active Now" color="text-emerald-600" />
        <StatCard
          icon={<FaExclamationTriangle className="w-6 h-6 text-yellow-500" />}
          bg="bg-yellow-50" value={delayedTrips} label="Delayed" color="text-yellow-600" />
        <StatCard
          icon={<FaCalendarAlt className="w-6 h-6 text-indigo-500" />}
          bg="bg-indigo-50" value={deactivatedTrips} label="Deactivated Trips" color="text-indigo-600" />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-64 shadow-sm">
          <IoSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search trip ID, route or bus…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-10 border border-gray-200 rounded-xl px-3 bg-white text-sm text-gray-700 shadow-sm outline-none cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TripStatus | "All")}
        >
          <option value="All">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          className="h-10 border border-gray-200 rounded-xl px-3 bg-white text-sm text-gray-700 shadow-sm outline-none cursor-pointer"
          value={dirFilter}
          onChange={(e) => setDirFilter(e.target.value as Direction | "All")}
        >
          <option value="All">All Directions</option>
          <option value="forward">Forward</option>
          <option value="return">Return</option>
        </select>

        <button
          onClick={openAddModal}
          className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
        >
          <IoAddCircle className="w-4 h-4" />
          Add Trip
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="responsive-table">

        <div className="min-w-max grid grid-cols-[110px_220px_130px_100px_100px_100px_150px_116px] bg-[#f8fafc] px-5 pr-2.5 py-3 text-[11px] font-black text-gray-500 border-b uppercase tracking-widest">
          <div>Trip ID</div>
          <div>Route</div>
          <div>Bus</div>
          <div>Departure</div>
          <div>Arrival</div>
          <div>Duration</div>
          <div>Days</div>
          <div className="text-right pr-2.5">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-semibold">Loading trips…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
            <MdDirectionsBus className="w-8 h-8 opacity-30" />
            <p className="text-sm font-semibold">No trips found.</p>
          </div>
        ) : (
          filtered.map((trip, idx) => (
            <div
              key={trip.id}
              className={`grid grid-cols-[110px_220px_130px_100px_100px_100px_150px_116px] items-center px-5 pr-2.5 py-3.5 border-b transition-colors duration-150 ${
                idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              } hover:bg-blue-50/30`}
            >
              <div className="font-mono text-[11px] font-bold text-gray-400 tracking-wider">
                {`TR-${String(trip.id).padStart(3, "0")}`}
              </div>

              <div className="pr-2 min-w-0">
                <p className="font-semibold text-gray-800 text-[13px] truncate">
                  {trip.route?.routeName ?? "—"}
                </p>
                {trip.route && (
                  <p className="text-[10px] text-gray-400 truncate">
                    {trip.direction === "forward"
                      ? `${trip.route.from} → ${trip.route.to}`
                      : `${trip.route.to} → ${trip.route.from}`}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {trip.bus?.registrationNumber ?? "—"}
                </p>
                {trip.bus && (
                  <p className="text-[10px] text-gray-400">{trip.bus.busType}</p>
                )}
              </div>

              <div className="font-mono font-semibold text-gray-700 text-sm">
                {fmtTime(trip.departureTime)}
              </div>
              <div className="font-mono font-semibold text-gray-700 text-sm">
                {fmtTime(trip.arrivalTime)}
              </div>
              <div>
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-1 rounded-md">
                  ⏱ {displayDuration(trip)}
                </span>
              </div>

              <div className="text-xs text-gray-500 font-medium pr-2">
                {fmtDays(trip.days)}
              </div>

              <div className="flex items-center justify-end gap-1.5 pr-2.5">
                <button
                  onClick={() => setViewTrip(trip)}
                  title="View details"
                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 flex items-center justify-center transition-all active:scale-90"
                >
                  <IoEye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(trip)}
                  title="Edit trip"
                  className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 flex items-center justify-center transition-all active:scale-90"
                >
                  <IoPencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void handleToggleActive(trip)}
                  title={trip.isActive ? "Deactivate trip" : "Activate trip"}
                  disabled={statusUpdatingId === trip.id}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${trip.isActive ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"}`}
                >
                  <FaToggleOn className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 relative max-h-[92vh] overflow-y-auto">

            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm"
            >✕</button>

            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#122843] flex items-center justify-center shrink-0">
                <MdSchedule className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#122843] tracking-tight">
                  {editingTrip ? `Update TR-${String(editingTrip.id).padStart(3,"0")}` : "New Trip Schedule"}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {editingTrip ? "Edit trip details" : "Schedule a new trip"}
                </p>
              </div>
            </div>

            {(formError || apiError) && (
              <div className="mb-5 flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
                <span className="mt-0.5">⚠</span>
                <span>{formError || apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">

              <div className="col-span-2">
                <label className={labelCls}>Route</label>
                <select
                  className={inputCls}
                  value={form.routeId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">— Select a route —</option>
                  {routesLoading && <option disabled>Loading routes…</option>}
                  {!routesLoading && routes.length === 0 && <option disabled>No routes available</option>}
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} · {r.from} → {r.to}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Bus</label>
                <select
                  className={inputCls}
                  value={form.busId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, busId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">— Select a bus —</option>
                  {busesLoading && <option disabled>Loading buses…</option>}
                  {!busesLoading && buses.length === 0 && <option disabled>No buses available</option>}
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.registrationNumber} · {b.busType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Direction</label>
                <div className="flex gap-3">
                  {(["forward", "return"] as Direction[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, direction: d }))}
                      className={`flex-1 h-10 rounded-lg border-2 text-sm font-bold transition ${
                        form.direction === d
                          ? "border-[#4CAF8A] bg-[#4CAF8A]/10 text-[#4CAF8A]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {d === "forward" ? "⬆ Forward" : "⬇ Return"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Departure Time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.departureTime}
                  onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                />
              </div>

              <div>
                <label className={labelCls}>Arrival Time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.arrivalTime}
                  onChange={(e) => setForm((f) => ({ ...f, arrivalTime: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>
                  Duration <span className="text-[#4CAF8A] normal-case font-semibold">(auto)</span>
                </label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {calcDuration(form.departureTime, form.arrivalTime)}
                </div>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Operating Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-12 h-10 rounded-lg text-xs font-bold border-2 transition ${
                        form.days.includes(day)
                          ? "border-[#122843] bg-[#122843] text-white"
                          : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {[
                    { label: "Mon–Fri", days: ["Mon","Tue","Wed","Thu","Fri"] as Day[] },
                    { label: "Mon–Sat", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] as Day[] },
                    { label: "Daily",   days: [...ALL_DAYS] as Day[] },
                    { label: "Clear",   days: [] as Day[] },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, days: preset.days }))}
                      className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200 transition"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2 rounded-xl bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition active:scale-95"
              >
                {editingTrip ? "Save Changes" : "Create Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setViewTrip(null)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm"
            >✕</button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#122843] flex items-center justify-center shrink-0">
                <MdSchedule className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#122843] tracking-tight">
                  Trip Info: {`TR-${String(viewTrip.id).padStart(3, "0")}`}
                </h2>
                
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 bg-gray-50/80 p-5 rounded-xl border border-gray-100 mb-4">
              {[
                ["Trip ID",    `TR-${String(viewTrip.id).padStart(3, "0")}`],
                ["Route",      viewTrip.route?.routeName ?? "—"],
                ["Direction",  viewTrip.direction === "forward" ? "⬆ Forward" : "⬇ Return"],
                ["From",       viewTrip.direction === "forward" ? (viewTrip.route?.from ?? "—") : (viewTrip.route?.to ?? "—")],
                ["To",         viewTrip.direction === "forward" ? (viewTrip.route?.to ?? "—") : (viewTrip.route?.from ?? "—")],
                ["Bus Plate",  viewTrip.bus?.registrationNumber ?? "—"],
                ["Bus Type",   viewTrip.bus?.busType ?? "—"],
                ["Departure",  fmtTime(viewTrip.departureTime)],
                ["Arrival",    fmtTime(viewTrip.arrivalTime)],
                ["Duration",   displayDuration(viewTrip)],
                ["Days",       fmtDays(viewTrip.days)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">{label}</p>
                  <p className="font-bold text-gray-800 text-sm">{val}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => { setViewTrip(null); openEditModal(viewTrip); }}
                className="px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition flex items-center gap-2"
              >
                <IoPencil className="w-3.5 h-3.5" /> Edit Trip
              </button>
              <button
                onClick={() => setViewTrip(null)}
                className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl hover:bg-[#1a3a5c] transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}