"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { CgClose } from "react-icons/cg";
import { IoEye } from "react-icons/io5";
import { FiEdit2, FiSearch } from "react-icons/fi";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import { MdDirectionsBus, MdSchedule } from "react-icons/md";

// ─── Types ────────────────────────────────────────────────────────────────────
type TripStatus = "Active" | "Scheduled" | "Delayed" | "Completed";
type Direction = "Forward" | "Return";

type Trip = {
  id: string;
  routeId: number;
  routeName: string;
  direction: Direction;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  busId: string;
  driverName: string;
  days: string;
  status: TripStatus;
};

type Route = { id: number; name: string; from: string; to: string };

// ─── Inline API helper ────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_ROUTES: Route[] = [
  { id: 1, name: "Route 120", from: "Colombo Fort", to: "Kesbewa" },
  { id: 2, name: "Route 138", from: "Colombo Fort", to: "Avissawella" },
  { id: 3, name: "Route 155", from: "Colombo Fort", to: "Malabe" },
  { id: 4, name: "Route 176", from: "Nugegoda",     to: "Homagama" },
  { id: 5, name: "Route 212", from: "Maharagama",   to: "Piliyandala" },
];

const SAMPLE_TRIPS: Trip[] = [
  {
    id: "TR-001", routeId: 1, routeName: "Route 120",
    direction: "Forward", from: "Colombo Fort", to: "Kesbewa",
    departure: "06:00", arrival: "07:10", duration: "1h 10m",
    busId: "CP NB-1234", driverName: "Kasun Silva",
    days: "Mon-Sat", status: "Active",
  },
  {
    id: "TR-002", routeId: 1, routeName: "Route 120",
    direction: "Return", from: "Kesbewa", to: "Colombo Fort",
    departure: "07:30", arrival: "08:40", duration: "1h 10m",
    busId: "CP NB-1234", driverName: "Kasun Silva",
    days: "Mon-Sat", status: "Scheduled",
  },
  {
    id: "TR-003", routeId: 2, routeName: "Route 138",
    direction: "Forward", from: "Colombo Fort", to: "Avissawella",
    departure: "08:30", arrival: "10:00", duration: "1h 30m",
    busId: "WP BA-5678", driverName: "Nimal Perera",
    days: "Mon-Sun", status: "Active",
  },
  {
    id: "TR-004", routeId: 2, routeName: "Route 138",
    direction: "Return", from: "Avissawella", to: "Colombo Fort",
    departure: "11:00", arrival: "12:30", duration: "1h 30m",
    busId: "WP BA-5678", driverName: "Nimal Perera",
    days: "Mon-Sun", status: "Delayed",
  },
  {
    id: "TR-005", routeId: 3, routeName: "Route 155",
    direction: "Forward", from: "Colombo Fort", to: "Malabe",
    departure: "07:00", arrival: "08:15", duration: "1h 15m",
    busId: "SP CA-9012", driverName: "Ruwan Fernando",
    days: "Mon-Fri", status: "Scheduled",
  },
  {
    id: "TR-006", routeId: 4, routeName: "Route 176",
    direction: "Forward", from: "Nugegoda", to: "Homagama",
    departure: "09:00", arrival: "09:45", duration: "45m",
    busId: "WP KF-3456", driverName: "Sunil Bandara",
    days: "Mon-Sat", status: "Completed",
  },
  {
    id: "TR-007", routeId: 5, routeName: "Route 212",
    direction: "Forward", from: "Maharagama", to: "Piliyandala",
    departure: "13:45", arrival: "14:30", duration: "45m",
    busId: "CP NB-7890", driverName: "Chaminda Ratne",
    days: "Mon-Sat", status: "Scheduled",
  },
  {
    id: "TR-008", routeId: 3, routeName: "Route 155",
    direction: "Return", from: "Malabe", to: "Colombo Fort",
    departure: "17:00", arrival: "18:20", duration: "1h 20m",
    busId: "SP CA-9012", driverName: "Ruwan Fernando",
    days: "Mon-Fri", status: "Active",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<TripStatus, string> = {
  Active:    "bg-[#61de9f] text-[#00796b]",
  Scheduled: "bg-blue-100 text-blue-700",
  Delayed:   "bg-yellow-100 text-yellow-700",
  Completed: "bg-gray-100 text-gray-500",
};

const STATUS_OPTIONS: TripStatus[] = ["Active", "Scheduled", "Delayed", "Completed"];

const DAY_OPTIONS = [
  "All days",
  "Mon-Fri",
  "Mon-Sat",
  "Mon-Sun",
  "Sat-Sun",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DIRECTION_OPTIONS: Direction[] = ["Forward", "Return"];

type FormData = {
  routeName: string;
  direction: Direction;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  busId: string;
  driverName: string;
  days: string;
  status: TripStatus;
};

const emptyForm = (): FormData => ({
  routeName: "",
  direction: "Forward",
  from: "",
  to: "",
  departure: "",
  arrival: "",
  busId: "",
  driverName: "",
  days: "Mon-Sat",
  status: "Scheduled",
});

// ─── Duration helper ──────────────────────────────────────────────────────────
function calcDuration(dep: string, arr: string): string {
  if (!dep || !arr) return "-";
  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins <= 0) mins += 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── ID generator ─────────────────────────────────────────────────────────────
function nextTripId(trips: Trip[]): string {
  const nums = trips.map((t) => parseInt(t.id.replace("TR-", "")) || 0);
  const next = (Math.max(0, ...nums) + 1).toString().padStart(3, "0");
  return `TR-${next}`;
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminManageTrips() {
  const [trips,        setTrips]        = useState<Trip[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [dayFilter,    setDayFilter]    = useState("All days");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "All">("All");
  const [showModal,    setShowModal]    = useState(false);
  const [editingTrip,  setEditingTrip]  = useState<Trip | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm());
  const [formError,    setFormError]    = useState("");
  const [viewTrip,     setViewTrip]     = useState<Trip | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTrips     = trips.length;
  const activeNow      = trips.filter((t) => t.status === "Active").length;
  const delayedTrips   = trips.filter((t) => t.status === "Delayed").length;
  const scheduledTrips = trips.filter((t) => t.status === "Scheduled").length;

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tripsRes = await apiFetch<any>("/trips");
      const tripsArr = tripsRes?.trips ?? tripsRes?.data ?? (Array.isArray(tripsRes) ? tripsRes : null);
      setTrips(tripsArr ?? SAMPLE_TRIPS);
    } catch {
      setTrips(SAMPLE_TRIPS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => trips.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.id.toLowerCase().includes(q) ||
      t.routeName?.toLowerCase().includes(q) ||
      t.busId?.toLowerCase().includes(q) ||
      t.driverName?.toLowerCase().includes(q);
    const matchDay    = dayFilter === "All days" || t.days === dayFilter;
    const matchStatus = statusFilter === "All"   || t.status === statusFilter;
    return matchSearch && matchDay && matchStatus;
  }), [trips, search, dayFilter, statusFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.routeName.trim())  { setFormError("Route name is required."); return; }
    if (!form.from.trim())       { setFormError("From location is required."); return; }
    if (!form.to.trim())         { setFormError("To location is required."); return; }
    if (!form.departure)         { setFormError("Departure time is required."); return; }
    if (!form.arrival)           { setFormError("Arrival time is required."); return; }
    if (!form.busId.trim())      { setFormError("Bus ID is required."); return; }
    if (!form.driverName.trim()) { setFormError("Driver name is required."); return; }

    const payload: Trip = {
      id:         editingTrip ? editingTrip.id : nextTripId(trips),
      routeId:    editingTrip?.routeId ?? 0,
      routeName:  form.routeName,
      direction:  form.direction,
      from:       form.from,
      to:         form.to,
      departure:  form.departure,
      arrival:    form.arrival,
      duration:   calcDuration(form.departure, form.arrival),
      busId:      form.busId,
      driverName: form.driverName,
      days:       form.days,
      status:     form.status,
    };

    try {
      if (editingTrip) {
        await apiFetch(`/trips/${editingTrip.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/trips", { method: "POST", body: JSON.stringify(payload) });
      }
    } catch {
      // API unavailable — update local state directly
      if (editingTrip) {
        setTrips((prev) => prev.map((t) => t.id === editingTrip.id ? payload : t));
      } else {
        setTrips((prev) => [...prev, payload]);
      }
    }

    Swal.fire({
      icon: "success",
      title: editingTrip ? "Trip Updated" : "Trip Created",
      timer: 1500,
      showConfirmButton: false,
    });
    setShowModal(false);
    setFormError("");
  };

  const handleDelete = async (trip: Trip) => {
    const result = await Swal.fire({
      title: `Delete ${trip.id}?`,
      text: "This trip schedule will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await apiFetch(`/trips/${trip.id}`, { method: "DELETE" });
    } catch {
      // API unavailable — remove locally
    }
    setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    Swal.fire({ icon: "success", title: "Trip Deleted", timer: 1500, showConfirmButton: false });
  };

  const openAddModal = () => {
    setEditingTrip(null);
    setForm(emptyForm());
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setForm({
      routeName:  trip.routeName,
      direction:  trip.direction,
      from:       trip.from,
      to:         trip.to,
      departure:  trip.departure,
      arrival:    trip.arrival,
      busId:      trip.busId,
      driverName: trip.driverName,
      days:       trip.days,
      status:     trip.status,
    });
    setFormError("");
    setShowModal(true);
  };

  // ── Stat card config ───────────────────────────────────────────────────────
  const statCards = [
    { icon: <MdDirectionsBus size={36} className="text-[#122843]" />,         val: totalTrips,     label: "Total Trips",  color: "text-black"      },
    { icon: <FaCheckCircle   size={36} className="text-[#00796b]" />,         val: activeNow,      label: "Active Now",   color: "text-[#00796b]"  },
    { icon: <FaExclamationTriangle size={36} className="text-yellow-500" />,  val: delayedTrips,   label: "Delayed",      color: "text-yellow-500" },
    { icon: <FaCalendarAlt   size={36} className="text-blue-500" />,          val: scheduledTrips, label: "Scheduled",    color: "text-blue-500"   },
  ];

  const inputCls = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A] transition text-black";
  const labelCls = "block text-[10px] uppercase font-black text-gray-400 mb-1";

  return (
    <div className="p-6">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ icon, val, label, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
            <div className="w-12 h-12 flex items-center justify-center">{icon}</div>
            <div>
              <p className={`text-3xl font-extrabold ${color}`}>{val}</p>
              <p className="text-[#94a0ae] text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-72 shadow-sm">
          <FiSearch className="w-5 h-5 text-gray-400 opacity-50" />
          <input
            type="text"
            placeholder="Search route or bus..."
            className="flex-1 text-sm bg-transparent outline-none text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
        >
          {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TripStatus | "All")}
        >
          <option value="All">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          onClick={openAddModal}
          className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-md"
        >
          + Add trip
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-12 bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase tracking-wider">
          <div className="col-span-1">Trip ID</div>
          <div className="col-span-2">Route</div>
          <div className="col-span-2">Direction</div>
          <div className="col-span-1">Departure</div>
          <div className="col-span-1">Arrival</div>
          <div className="col-span-1">Duration</div>
          <div className="col-span-1">Bus</div>
          <div className="col-span-1">Driver</div>
          <div className="col-span-1">Days</div>
          <div className="col-span-1">Status</div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-gray-400 text-sm">Loading trips...</div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-gray-400 text-sm">No trips found.</div>
        ) : filtered.map((trip) => (
          <div
            key={trip.id}
            className="grid grid-cols-12 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
          >
            <div className="col-span-1 font-semibold text-gray-500">{trip.id}</div>
            <div className="col-span-2 font-semibold text-[#122843]">{trip.routeName}</div>
            <div className="col-span-2 text-xs">
              <span className="font-semibold text-gray-700">{trip.from}</span>
              <span className="mx-1 text-gray-400">-&gt;</span>
              <span className="font-semibold text-gray-700">{trip.to}</span>
            </div>
            <div className="col-span-1 font-mono font-semibold text-gray-700">{trip.departure}</div>
            <div className="col-span-1 font-mono font-semibold text-gray-700">{trip.arrival}</div>
            <div className="col-span-1 text-gray-500 text-xs">{trip.duration}</div>
            <div className="col-span-1 text-xs font-medium text-gray-600">{trip.busId}</div>
            <div className="col-span-1 text-xs font-medium text-gray-600 truncate">{trip.driverName}</div>
            <div className="col-span-1 text-xs text-gray-500">{trip.days}</div>
            <div className="col-span-1 flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[trip.status]}`}>
                {trip.status}
              </span>
              <button
                onClick={() => setViewTrip(trip)}
                className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition"
              >
                <IoEye size={18} className="text-blue-500" />
              </button>
              <button
                onClick={() => openEditModal(trip)}
                className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition"
              >
                <FiEdit2 size={15} className="text-amber-500" />
              </button>
              <button
                onClick={() => handleDelete(trip)}
                className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition"
              >
                <CgClose size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition"
              onClick={() => setShowModal(false)}
            >
              <CgClose size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <MdSchedule size={32} className="text-[#122843]" />
              {editingTrip ? `Update ${editingTrip.id}` : "New Trip Schedule"}
            </h2>

            {formError && (
              <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Route Name */}
              <div className="col-span-2">
                <label className={labelCls}>Route Name</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Route 120"
                  value={form.routeName}
                  onChange={(e) => setForm({ ...form, routeName: e.target.value })}
                />
              </div>

              {/* Direction */}
              <div className="col-span-2">
                <label className={labelCls}>Direction</label>
                <div className="flex gap-3">
                  {DIRECTION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, direction: d })}
                      className={`flex-1 h-10 rounded-lg border-2 text-sm font-bold transition ${
                        form.direction === d
                          ? "border-[#4CAF8A] bg-[#4CAF8A]/10 text-[#4CAF8A]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {d === "Forward" ? "Forward" : "Return"}
                    </button>
                  ))}
                </div>
              </div>

              {/* From */}
              <div>
                <label className={labelCls}>From</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Colombo Fort"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                />
              </div>

              {/* To */}
              <div>
                <label className={labelCls}>To</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Kesbewa"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
              </div>

              {/* Departure */}
              <div>
                <label className={labelCls}>Departure Time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.departure}
                  onChange={(e) => setForm({ ...form, departure: e.target.value })}
                />
              </div>

              {/* Arrival */}
              <div>
                <label className={labelCls}>Arrival Time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.arrival}
                  onChange={(e) => setForm({ ...form, arrival: e.target.value })}
                />
              </div>

              {/* Duration (auto) */}
              <div>
                <label className={labelCls}>Duration <span className="text-[#4CAF8A] normal-case font-semibold">(auto)</span></label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {calcDuration(form.departure, form.arrival)}
                </div>
              </div>

              {/* Operating Days */}
              <div>
                <label className={labelCls}>Operating Days</label>
                <select
                  className={inputCls}
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                >
                  {DAY_OPTIONS.filter((d) => d !== "All days").map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Bus ID */}
              <div>
                <label className={labelCls}>Bus ID</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. CP NB-1234"
                  value={form.busId}
                  onChange={(e) => setForm({ ...form, busId: e.target.value })}
                />
              </div>

              {/* Driver */}
              <div>
                <label className={labelCls}>Driver Name</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Kasun Silva"
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="col-span-2">
                <label className={labelCls}>Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TripStatus })}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200 transition"
                onClick={() => setShowModal(false)}
              >
                Discard
              </button>
              <button
                className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition"
                onClick={handleSave}
              >
                Save Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {viewTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition"
              onClick={() => setViewTrip(null)}
            >
              <CgClose size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <MdSchedule size={32} className="text-[#122843]" />
              Trip Info: {viewTrip.id}
            </h2>

            <div className="grid grid-cols-2 gap-5 bg-gray-50/50 p-5 rounded-xl border border-gray-100 mb-4">
              {[
                ["Trip ID",   viewTrip.id],
                ["Route",     viewTrip.routeName],
                ["Direction", viewTrip.direction],
                ["From",      viewTrip.from],
                ["To",        viewTrip.to],
                ["Departure", viewTrip.departure],
                ["Arrival",   viewTrip.arrival],
                ["Duration",  viewTrip.duration],
                ["Bus",       viewTrip.busId],
                ["Driver",    viewTrip.driverName],
                ["Days",      viewTrip.days],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1">{label}</p>
                  <p className="font-bold text-gray-800">{val}</p>
                </div>
              ))}
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewTrip.status]}`}>
                  {viewTrip.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewTrip(null)}
                className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl hover:bg-[#1a3a5c] transition"
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