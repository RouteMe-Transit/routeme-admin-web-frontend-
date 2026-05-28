"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { IoEye, IoSearch, IoAddCircle } from "react-icons/io5";
import { IoPencil } from "react-icons/io5";
import { IoBan, IoCheckmarkCircle } from "react-icons/io5";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdDirectionsBus, MdSchedule } from "react-icons/md";
import { FaXmark } from "react-icons/fa6";
import axios from "axios";

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
const STATUS_OPTIONS: TripStatus[] = ["active", "scheduled", "delayed", "completed", "cancelled"];

const STATUS_BADGE: Record<TripStatus, string> = {
  active:    "bg-emerald-600 text-white",
  scheduled: "bg-blue-600 text-white",
  delayed:   "bg-yellow-500 text-white",
  completed: "bg-gray-500 text-white",
  cancelled: "bg-red-500 text-white",
};

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

function fmtTripId(id: number): string {
  return `TR-${String(id).padStart(3, "0")}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  open, title, message, confirmLabel, confirmClass, onCancel, onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-lg font-bold text-gray-800">{title}</h3>
        <p className="mb-5 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form types ───────────────────────────────────────────────────────────────
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

// ─── Input styles ─────────────────────────────────────────────────────────────
const inputBase = "w-full h-10 border rounded-md px-2 text-sm outline-none transition bg-white";
const inputNormal = `${inputBase} border-[#828282]/70 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const labelCls = "block mb-2 font-semibold text-sm text-gray-700";

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminManageTrips() {
  const [trips,         setTrips]         = useState<Trip[]>([]);
  const [routes,        setRoutes]        = useState<Route[]>([]);
  const [buses,         setBuses]         = useState<Bus[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [busesLoading,  setBusesLoading]  = useState(false);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "All">("All");
  const [dirFilter,    setDirFilter]    = useState<Direction | "All">("All");

  const [showModal,    setShowModal]    = useState(false);
  const [editingTrip,  setEditingTrip]  = useState<Trip | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm());
  const [formError,    setFormError]    = useState("");
  const [apiError,     setApiError]     = useState("");
  const [viewTrip,     setViewTrip]     = useState<Trip | null>(null);
  const [submitting,   setSubmitting]   = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "",
    confirmClass: "",
    onConfirm: () => {},
  });

  const totalTrips       = trips.length;
  const activeNow        = trips.filter((t) => t.isActive).length;
  const delayedTrips     = trips.filter((t) => t.status === "delayed").length;
  const deactivatedTrips = trips.filter((t) => !t.isActive).length;

  // ── Loaders ────────────────────────────────────────────────────────────────
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
      toast.error(err.response?.data?.message ?? err.message ?? "Failed to load trips");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const loadRoutes = useCallback(async () => {
    setRoutesLoading(true);
    try {
      const { data } = await api.get<{ data: { routes: Route[] } }>("/routes", { params: { limit: 200 } });
      setRoutes(data.data.routes ?? []);
    } catch { /* non-critical */ } finally {
      setRoutesLoading(false);
    }
  }, []);

  const loadBuses = useCallback(async () => {
    setBusesLoading(true);
    try {
      const { data } = await api.get<{ data: { buses: Bus[] } }>("/buses", { params: { limit: 200 } });
      setBuses(data.data.buses ?? []);
    } catch { /* non-critical */ } finally {
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
    const matchSearch =
      fmtTripId(t.id).toLowerCase().includes(q) ||
      (t.route?.routeName ?? "").toLowerCase().includes(q) ||
      (t.bus?.registrationNumber ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchDir    = dirFilter === "All"    || t.direction === dirFilter;
    return matchSearch && matchStatus && matchDir;
  }), [trips, search, statusFilter, dirFilter]);

  // ── Modals ─────────────────────────────────────────────────────────────────
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

    setSubmitting(true);
    try {
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, payload);
        toast.success("Trip updated successfully");
      } else {
        await api.post("/trips", payload);
        toast.success("Trip created successfully");
      }
      await loadTrips();
      setShowModal(false);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Save failed";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Deactivate trip ────────────────────────────────────────────────────────
  const handleDeactivate = (trip: Trip) => {
    setConfirmState({
      open: true,
      title: `Deactivate ${fmtTripId(trip.id)}?`,
      message: "This trip will be marked inactive and won't appear to passengers.",
      confirmLabel: "Yes, deactivate",
      confirmClass: "bg-red-500 hover:bg-red-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await api.patch(`/trips/${trip.id}/status`, { status: "cancelled" });
          await api.put(`/trips/${trip.id}`, {
            routeId:       trip.routeId,
            busId:         trip.busId,
            direction:     trip.direction,
            departureTime: fmtTime(trip.departureTime),
            arrivalTime:   fmtTime(trip.arrivalTime),
            days:          trip.days,
            status:        "cancelled",
            isActive:      false,
          });
          await loadTrips({ silent: true });
          toast.success("Trip deactivated successfully");
        } catch (err: any) {
          toast.error(err.response?.data?.message ?? err.message ?? "Failed to deactivate trip");
        }
      },
    });
  };

  // ── Reactivate trip ───────────────────────────────────────────────────────
  const handleReactivate = (trip: Trip) => {
    setConfirmState({
      open: true,
      title: `Reactivate ${fmtTripId(trip.id)}?`,
      message: "This trip will be restored and visible to passengers.",
      confirmLabel: "Yes, reactivate",
      confirmClass: "bg-emerald-500 hover:bg-emerald-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await api.patch(`/trips/${trip.id}/status`, { status: "active" });
          await api.put(`/trips/${trip.id}`, {
            routeId:       trip.routeId,
            busId:         trip.busId,
            direction:     trip.direction,
            departureTime: fmtTime(trip.departureTime),
            arrivalTime:   fmtTime(trip.arrivalTime),
            days:          trip.days,
            status:        "active",
            isActive:      true,
          });
          await loadTrips({ silent: true });
          toast.success("Trip reactivated successfully");
        } catch (err: any) {
          toast.error(err.response?.data?.message ?? err.message ?? "Failed to reactivate trip");
        }
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <section className="p-6">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<MdDirectionsBus className="w-5 h-5 text-blue-500" />}
            bg="bg-blue-50" value={totalTrips} label="Total Trips" color="text-blue-600" />
          <StatCard
            icon={<FaCheckCircle className="w-5 h-5 text-emerald-500" />}
            bg="bg-emerald-50" value={activeNow} label="Active Now" color="text-emerald-600" />
          <StatCard
            icon={<FaExclamationTriangle className="w-5 h-5 text-yellow-500" />}
            bg="bg-yellow-50" value={delayedTrips} label="Delayed" color="text-yellow-600" />
          <StatCard
            icon={<FaCalendarAlt className="w-5 h-5 text-indigo-500" />}
            bg="bg-indigo-50" value={deactivatedTrips} label="Deactivated" color="text-indigo-600" />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="rounded-xl border border-gray-100 mb-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-72 shadow-sm">
              <IoSearch className="w-4 h-4 opacity-50 shrink-0" />
              <input
                type="text"
                placeholder="Search trip ID, route or bus…"
                className="flex-1 text-sm bg-transparent outline-none text-black"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TripStatus | "All")}
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            {/* Direction filter */}
            <select
              className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
              value={dirFilter}
              onChange={(e) => setDirFilter(e.target.value as Direction | "All")}
            >
              <option value="All">All Directions</option>
              <option value="forward">Forward</option>
              <option value="return">Return</option>
            </select>

            {/* Add Trip button */}
            <button
              onClick={openAddModal}
              className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
            >
              <IoAddCircle className="w-4 h-4" />
              Add Trip
            </button>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-max md:min-w-full">

              {/* Header */}
              <div className="grid grid-cols-[100px_1fr_140px_90px_90px_100px_150px_116px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
                <div>Trip ID</div>
                <div>Route</div>
                <div>Bus</div>
                <div>Departure</div>
                <div>Arrival</div>
                <div>Duration</div>
                <div>Days</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading trips...
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No trips found.</div>
              ) : (
                filtered.map((trip) => (
                  <div
                    key={trip.id}
                    className="grid grid-cols-[100px_1fr_140px_90px_90px_100px_150px_116px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
                  >
                    {/* Trip ID */}
                    <div className="font-semibold text-[#122843] whitespace-nowrap font-mono text-[12px]">
                      {fmtTripId(trip.id)}
                    </div>

                    {/* Route */}
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-gray-800 truncate text-sm">
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

                    {/* Bus */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        {trip.bus?.registrationNumber ?? "—"}
                      </p>
                      {trip.bus && (
                        <p className="text-[10px] text-gray-400">{trip.bus.busType}</p>
                      )}
                    </div>

                    {/* Departure */}
                    <div className="font-mono font-semibold text-gray-700 text-sm">
                      {fmtTime(trip.departureTime)}
                    </div>

                    {/* Arrival */}
                    <div className="font-mono font-semibold text-gray-700 text-sm">
                      {fmtTime(trip.arrivalTime)}
                    </div>

                    {/* Duration */}
                    <div>
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-1 rounded-md">
                        ⏱ {displayDuration(trip)}
                      </span>
                    </div>

                    {/* Days */}
                    <div className="text-xs text-gray-500 font-medium pr-2">
                      {fmtDays(trip.days)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View */}
                      <button
                        onClick={() => setViewTrip(trip)}
                        title="View details"
                        className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition"
                      >
                        <IoEye className="text-blue-600 w-4 h-4" />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(trip)}
                        title="Edit trip"
                        className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition"
                      >
                        <IoPencil className="text-amber-500 w-3.5 h-3.5" />
                      </button>
                      {/* Deactivate / Reactivate */}
                      {trip.isActive ? (
                        <button
                          onClick={() => handleDeactivate(trip)}
                          title="Deactivate trip"
                          className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition"
                        >
                          <IoBan className="text-red-400 w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(trip)}
                          title="Reactivate trip"
                          className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 shadow-sm transition"
                        >
                          <IoCheckmarkCircle className="text-emerald-500 w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FaXmark />
            </button>

            <h3 className="mb-1 text-lg font-bold text-gray-800">
              {editingTrip ? `Update ${fmtTripId(editingTrip.id)}` : "New Trip Schedule"}
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {editingTrip ? `Editing — ${fmtTripId(editingTrip.id)}` : "Schedule a new trip for a route."}
            </p>
            <p className="mb-4 text-xs text-gray-500">
              Fields marked with <span className="text-red-600">*</span> are mandatory.
            </p>

            {/* Error banner */}
            {(formError || apiError) && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <span className="mt-0.5">⚠</span>
                <span>{formError || apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">

              {/* Route */}
              <div>
                <label className={labelCls}>Route <span className="text-red-600">*</span></label>
                <select
                  className={inputNormal}
                  value={form.routeId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">— Select a route —</option>
                  {routesLoading && <option disabled>Loading routes…</option>}
                  {!routesLoading && routes.length === 0 && <option disabled>No routes available</option>}
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.routeName} · {r.from} → {r.to}</option>
                  ))}
                </select>
              </div>

              {/* Bus */}
              <div>
                <label className={labelCls}>Bus <span className="text-red-600">*</span></label>
                <select
                  className={inputNormal}
                  value={form.busId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, busId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">— Select a bus —</option>
                  {busesLoading && <option disabled>Loading buses…</option>}
                  {!busesLoading && buses.length === 0 && <option disabled>No buses available</option>}
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>{b.registrationNumber} · {b.busType}</option>
                  ))}
                </select>
              </div>

              {/* Direction */}
              <div>
                <label className={labelCls}>Direction <span className="text-red-600">*</span></label>
                <div className="flex gap-2">
                  {(["forward", "return"] as Direction[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, direction: d }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        form.direction === d
                          ? "bg-[#122843] text-white border-[#122843]"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {d === "forward" ? "⬆ Forward" : "⬇ Return"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Departure <span className="text-red-600">*</span></label>
                  <input
                    type="time"
                    className={inputNormal}
                    value={form.departureTime}
                    onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Arrival <span className="text-red-600">*</span></label>
                  <input
                    type="time"
                    className={inputNormal}
                    value={form.arrivalTime}
                    onChange={(e) => setForm((f) => ({ ...f, arrivalTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Duration — auto */}
              <div>
                <label className={labelCls}>
                  Duration{" "}
                  <span className="text-[#4CAF8A] text-xs font-normal">(auto-calculated)</span>
                </label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-md px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {calcDuration(form.departureTime, form.arrivalTime)}
                </div>
              </div>

              {/* Operating Days */}
              <div>
                <label className={labelCls}>Operating Days <span className="text-red-600">*</span></label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-11 h-9 rounded-lg text-xs font-bold border-2 transition ${
                        form.days.includes(day)
                          ? "border-[#122843] bg-[#122843] text-white"
                          : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {/* Presets */}
                <div className="flex gap-2 flex-wrap">
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

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md bg-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSave}
                className="rounded-xl bg-[#f5a623] hover:bg-[#e09510] px-8 py-2 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-gray-400 active:scale-95"
              >
                {submitting ? "Saving..." : editingTrip ? "Save Changes" : "Create Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button
              type="button"
              aria-label="Close view modal"
              onClick={() => setViewTrip(null)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FaXmark />
            </button>

            <h3 className="mb-5 text-lg font-bold text-gray-800">Trip Details</h3>

            {/* Icon + ID header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#122843] flex items-center justify-center shadow-md shrink-0">
                <MdSchedule className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#122843]">
                  {fmtTripId(viewTrip.id)}
                </h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  {viewTrip.route?.routeName ?? "—"}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Direction:</strong> {viewTrip.direction === "forward" ? "⬆ Forward" : "⬇ Return"}</p>
              <p><strong>From:</strong> {viewTrip.direction === "forward" ? (viewTrip.route?.from ?? "—") : (viewTrip.route?.to ?? "—")}</p>
              <p><strong>To:</strong> {viewTrip.direction === "forward" ? (viewTrip.route?.to ?? "—") : (viewTrip.route?.from ?? "—")}</p>
              <p><strong>Bus Plate:</strong> {viewTrip.bus?.registrationNumber ?? "—"}</p>
              <p><strong>Bus Type:</strong> {viewTrip.bus?.busType ?? "—"}</p>
              <p><strong>Departure:</strong> {fmtTime(viewTrip.departureTime)}</p>
              <p><strong>Arrival:</strong> {fmtTime(viewTrip.arrivalTime)}</p>
              <p><strong>Duration:</strong> {displayDuration(viewTrip)}</p>
              <p><strong>Days:</strong> {fmtDays(viewTrip.days)}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${STATUS_BADGE[viewTrip.status]}`}>
                  {viewTrip.status}
                </span>
              </p>
              <p>
                <strong>Active:</strong>{" "}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${viewTrip.isActive ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                  {viewTrip.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex justify-between items-center">
              <button
                onClick={() => { setViewTrip(null); openEditModal(viewTrip); }}
                className="px-5 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition flex items-center gap-2"
              >
                <IoPencil className="w-3.5 h-3.5" /> Edit Trip
              </button>
              <button
                onClick={() => setViewTrip(null)}
                className="rounded-lg bg-[#4CAF8A] px-8 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#3d9e7a] transition"
              >
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