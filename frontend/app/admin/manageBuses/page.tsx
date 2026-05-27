"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { z, ZodIssue } from "zod";
import {
  IoEye,
  IoPencil,
  IoBan,
  IoSearch,
  IoCheckmarkCircle,
  IoBus,
} from "react-icons/io5";
import { FiTruck, FiTool, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────
type BusStatus = "Active" | "Maintenance" | "Breakdown";
type BusType   = "A/C Express" | "Semi-Luxury" | "Regular";

type Owner  = { name: string; nic: string; email: string; phone: string };
type Driver = { name: string; nic: string; email: string; phone: string };

type Route = {
  id:        number;
  routeName: string;
  from:      string;
  to:        string;
};

type Bus = {
  id:                 number;
  registrationNumber: string;
  busType:            BusType;
  routeId:            number | null;
  route?:             Route | null;
  totalSeats:         number;
  recordedAt:         string | null;
  isActive:           boolean;
  ownerName:          string;
  ownerNic:           string;
  ownerEmail:         string;
  ownerPhone:         string;
  drivers:            Driver[];
  createdAt:          string;
};

type BusFormValues = {
  registrationNumber: string;
  routeId:            number | null;
  busType:            BusType;
  totalSeats:         number;
  lastService:        string;
  status:             BusStatus;
  owner:              Owner;
  drivers:            Driver[];
  password:           string;
};

type FieldErrors = Record<string, string>;

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
const plateRegex = /^[A-Z]{2}\s([A-Z]{2,3}-\d{4}|\d{2}-\d{4})$/i;
const phoneRegex = /^07[0-9]{8}$/;
const nicRegex   = /^([0-9]{9}[VXvx]|[0-9]{12})$/;
const nameRegex  = /^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/;

const personSchema = z.object({
  name:  z.string().regex(nameRegex,  'Name must be like "Kavindra Senarathne"'),
  nic:   z.string().regex(nicRegex,   "NIC must be 9 digits + V/X (old) or 12 digits (new)"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(phoneRegex, "Phone must be 10 digits starting with 07"),
});

const routeIdSchema = z
  .union([z.number().int().positive("Please select a route"), z.null()])
  .refine((v) => v !== null && v > 0, { message: "Please select a route" });

const busFormSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, "License plate is required")
    .regex(plateRegex, 'Plate must be like "WP NC-1234"'),
  routeId:     routeIdSchema,
  busType:     z.enum(["A/C Express", "Semi-Luxury", "Regular"]),
  totalSeats:  z.number().int().min(1, "Seats must be at least 1"),
  lastService: z.string().min(1, "Last service date is required"),
  status:      z.enum(["Active", "Maintenance", "Breakdown"]),
  owner:       personSchema,
  drivers: z
    .array(personSchema)
    .min(1, "At least one driver is required")
    .max(3,  "Maximum 3 drivers"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const busEditSchema = busFormSchema.extend({
  routeId:  routeIdSchema,
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 8, "Password must be at least 8 characters"),
});

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
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

const fmtBusId = (id: number) => `BUS${String(id).padStart(4, "0")}`;
const fmtDate  = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";

const emptyOwner  = (): Owner  => ({ name: "", nic: "", email: "", phone: "" });
const emptyDriver = (): Driver => ({ name: "", nic: "", email: "", phone: "" });

const emptyForm = (): BusFormValues => ({
  registrationNumber: "",
  routeId:     null,
  busType:     "Regular",
  totalSeats:  45,
  lastService: "",
  status:      "Active",
  owner:       emptyOwner(),
  drivers:     [emptyDriver()],
  password:    "",
});

const STATUS_STYLES: Record<BusStatus, string> = {
  Active:      "bg-emerald-100 text-emerald-700",
  Maintenance: "bg-amber-100  text-amber-700",
  Breakdown:   "bg-red-100    text-red-600",
};

const STATUS_DOT: Record<BusStatus, string> = {
  Active:      "bg-emerald-500",
  Maintenance: "bg-amber-500",
  Breakdown:   "bg-red-500",
};

const BUS_TYPE_OPTIONS: BusType[]   = ["A/C Express", "Semi-Luxury", "Regular"];
const STATUS_OPTIONS:   BusStatus[] = ["Active", "Maintenance", "Breakdown"];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon, bg, value, label, color,
}: {
  icon: React.ReactNode;
  bg: string;
  value: number;
  label: string;
  color: string;
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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] text-red-500 font-semibold">{msg}</p>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputBase   = "w-full h-10 border rounded-lg px-3 text-sm outline-none transition bg-white";
const inputNormal = `${inputBase} border-gray-200 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const inputError  = `${inputBase} border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/30`;
const labelCls    = "block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest";
const smInputBase = "w-full h-9 border rounded-lg px-2.5 text-xs outline-none transition bg-white";
const smInputNorm = `${smInputBase} border-gray-200 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const smInputErr  = `${smInputBase} border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/30`;
const smLabelCls  = "block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider";

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminManageBuses() {
  const [buses,        setBuses]        = useState<Bus[]>([]);
  const [routes,       setRoutes]       = useState<Route[]>([]);
  const [routesLoading,setRoutesLoading]= useState(false);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<BusStatus | "All Status">("All Status");

  const [statusMap, setStatusMap] = useState<Record<number, BusStatus>>({});

  const [showModal,  setShowModal]  = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [viewBus,    setViewBus]    = useState<Bus | null>(null);

  const [form,        setForm]        = useState<BusFormValues>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState("");

  const [passwordMode, setPasswordMode] = useState<"auto" | "custom">("auto");
  const [autoPassword, setAutoPassword] = useState(generatePassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPwd,  setShowViewPwd]  = useState(false);
  const [pwdMap, setPwdMap] = useState<Record<number, string>>({});

  // ── Load buses ───────────────────────────────────────────────────────────────
  const loadBuses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: { total: number; buses: Bus[] } }>("/buses", {
        params: { limit: 200 },
      });
      const rows = data.data.buses ?? [];
      setBuses(rows);
      setStatusMap((prev) => {
        const next = { ...prev };
        rows.forEach((b) => {
          if (next[b.id] === undefined)
            next[b.id] = b.isActive ? "Active" : "Maintenance";
        });
        return next;
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to load buses",
        text: err.response?.data?.message ?? err.message ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load routes ──────────────────────────────────────────────────────────────
  const loadRoutes = useCallback(async () => {
    try {
      setRoutesLoading(true);
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

  useEffect(() => {
    loadBuses();
    loadRoutes();
  }, [loadBuses, loadRoutes]);

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const getBusStatus = (bus: Bus): BusStatus =>
    statusMap[bus.id] ?? (bus.isActive ? "Active" : "Maintenance");

  const getRouteName = (bus: Bus): string => {
    if (bus.route?.routeName) return bus.route.routeName;
    if (bus.routeId) {
      const found = routes.find((r) => r.id === bus.routeId);
      if (found) return found.routeName;
    }
    return "—";
  };

  const totalFleet    = buses.length;
  const inMaintenance = buses.filter((b) => getBusStatus(b) === "Maintenance").length;
  const breakdowns    = buses.filter((b) => getBusStatus(b) === "Breakdown").length;
  const operational   = buses.filter((b) => getBusStatus(b) === "Active").length;

  const filtered = buses.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      fmtBusId(b.id).toLowerCase().includes(q) ||
      b.registrationNumber.toLowerCase().includes(q) ||
      b.ownerName.toLowerCase().includes(q) ||
      getRouteName(b).toLowerCase().includes(q) ||
      b.drivers?.some((d) => d.name?.toLowerCase().includes(q));
    const st = getBusStatus(b);
    const matchStatus = statusFilter === "All Status" || st === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Zod error flattener ──────────────────────────────────────────────────────
  const flattenZodErrors = (issues: ZodIssue[]): FieldErrors => {
    const errs: FieldErrors = {};
    issues.forEach((e) => {
      const key = e.path.join(".");
      if (!errs[key]) errs[key] = e.message;
    });
    return errs;
  };

  const fe = (key: string) => fieldErrors[key];
  const ic = (key: string) => (fe(key) ? inputError  : inputNormal);
  const sc = (key: string) => (fe(key) ? smInputErr  : smInputNorm);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingBus(null);
    setForm(emptyForm());
    setAutoPassword(generatePassword());
    setPasswordMode("auto");
    setShowPassword(false);
    setFieldErrors({});
    setApiError("");
    setShowModal(true);
  };

  const openEditModal = (bus: Bus) => {
    setEditingBus(bus);
    setForm({
      registrationNumber: bus.registrationNumber,
      routeId:            bus.routeId ?? null,
      busType:            bus.busType,
      totalSeats:         bus.totalSeats,
      lastService:        bus.recordedAt ? bus.recordedAt.slice(0, 10) : "",
      status:             getBusStatus(bus),
      owner: {
        name:  bus.ownerName,
        nic:   bus.ownerNic,
        email: bus.ownerEmail,
        phone: bus.ownerPhone,
      },
      drivers:  bus.drivers?.length ? bus.drivers.map((d) => ({ ...d })) : [emptyDriver()],
      password: "",
    });
    setAutoPassword(pwdMap[bus.id] ?? generatePassword());
    setPasswordMode("auto");
    setShowPassword(false);
    setFieldErrors({});
    setApiError("");
    setShowModal(true);
  };

  // ── Owner / Driver field updaters ────────────────────────────────────────────
  const updateOwner = (field: keyof Owner, value: string) =>
    setForm((f) => ({ ...f, owner: { ...f.owner, [field]: value } }));

  const updateDriver = (i: number, field: keyof Driver, value: string) =>
    setForm((f) => {
      const drivers = [...f.drivers];
      drivers[i] = { ...drivers[i], [field]: value };
      return { ...f, drivers };
    });

  const addDriver = () => {
    if (form.drivers.length < 3)
      setForm((f) => ({ ...f, drivers: [...f.drivers, emptyDriver()] }));
  };

  const removeDriver = (i: number) =>
    setForm((f) => ({ ...f, drivers: f.drivers.filter((_, idx) => idx !== i) }));

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const finalPassword = passwordMode === "auto" ? autoPassword : form.password;
    const payload       = { ...form, password: finalPassword };
    const schema        = editingBus ? busEditSchema : busFormSchema;
    const result        = schema.safeParse(payload);

    if (!result.success) {
      setFieldErrors(flattenZodErrors(result.error.issues));
      return;
    }

    setFieldErrors({});
    setApiError("");

    const body: Record<string, unknown> = {
      registrationNumber: form.registrationNumber,
      busType:            form.busType,
      totalSeats:         form.totalSeats,
      routeId:            form.routeId,
      recordedAt:         form.lastService || null,
      owner:              form.owner,
      drivers:            form.drivers,
    };
    if (finalPassword) body.password = finalPassword;

    try {
      if (editingBus) {
        await api.put(`/buses/${editingBus.id}`, body);
        setStatusMap((m) => ({ ...m, [editingBus.id]: form.status }));
        if (finalPassword) setPwdMap((m) => ({ ...m, [editingBus.id]: finalPassword }));
        Swal.fire({ icon: "success", title: "Bus Updated",    timer: 1500, showConfirmButton: false });
      } else {
        const { data } = await api.post<{ data: { id: number } }>("/buses", body);
        const newId = data.data?.id ?? Date.now();
        setStatusMap((m) => ({ ...m, [newId]: form.status }));
        if (finalPassword) setPwdMap((m) => ({ ...m, [newId]: finalPassword }));
        Swal.fire({ icon: "success", title: "Bus Registered", timer: 1500, showConfirmButton: false });
      }
      await loadBuses();
      setShowModal(false);
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? err.message ?? "Save failed");
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────────
  const handleToggle = async (bus: Bus) => {
    const isActive = bus.isActive;
    const confirmed = await Swal.fire({
      title: `${isActive ? "Suspend" : "Reactivate"} ${fmtBusId(bus.id)}?`,
      text:  isActive
        ? "This bus will be deactivated."
        : "This bus will be restored to service.",
      icon:               isActive ? "warning" : "question",
      showCancelButton:   true,
      confirmButtonColor: isActive ? "#ef4444" : "#10b981",
      confirmButtonText:  isActive ? "Yes, suspend" : "Yes, reactivate",
    });
    if (!confirmed.isConfirmed) return;
    try {
      await api.patch(`/buses/${bus.id}/toggle`);
      await loadBuses();
      Swal.fire({
        icon:              "success",
        title:             isActive ? "Bus suspended" : "Bus reactivated",
        timer:             1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: err.response?.data?.message ?? err.message ?? "Failed" });
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-full">

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<FiTruck         className="w-6 h-6 text-blue-500"    />}
          bg="bg-blue-50"    value={totalFleet}    label="Total Fleet"    color="text-blue-600"    />
        <StatCard
          icon={<FiTool          className="w-6 h-6 text-amber-500"   />}
          bg="bg-amber-50"   value={inMaintenance} label="In Maintenance" color="text-amber-600"   />
        <StatCard
          icon={<FiAlertTriangle className="w-6 h-6 text-red-400"    />}
          bg="bg-red-50"     value={breakdowns}    label="Breakdowns"     color="text-red-500"     />
        <StatCard
          icon={<FiCheckCircle   className="w-6 h-6 text-emerald-500" />}
          bg="bg-emerald-50" value={operational}   label="Operational"    color="text-emerald-600" />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-64 shadow-sm">
          <IoSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search bus, plate or driver…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="h-10 border border-gray-200 rounded-xl px-3 bg-white text-sm text-gray-700 shadow-sm outline-none cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BusStatus | "All Status")}
        >
          <option value="All Status">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <button
          onClick={openAddModal}
          className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
        >
          <IoBus className="w-4 h-4" />
          Add Bus
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="responsive-table">

        {/* Header */}
        <div className="min-w-max grid grid-cols-[110px_140px_130px_160px_70px_120px_110px_116px] bg-[#f8fafc] px-5 py-3 text-[11px] font-black text-gray-500 border-b uppercase tracking-widest">
          <div>Bus ID</div>
          <div>Plate</div>
          <div>Type</div>
          <div>Route</div>
          <div>Seats</div>
          <div>Last Service</div>
          <div>Status</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-semibold">Loading buses…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
            <FiTruck className="w-8 h-8 opacity-30" />
            <p className="text-sm font-semibold">No buses found.</p>
          </div>
        ) : (
          filtered.map((bus, idx) => {
            const st = getBusStatus(bus);
            return (
              <div
                key={bus.id}
                className={`grid grid-cols-[110px_140px_130px_160px_70px_120px_110px_116px] items-center px-5 py-3.5 border-b transition-colors duration-150 ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                } hover:bg-blue-50/30`}
              >
                <div className="font-mono text-[11px] font-bold text-gray-400 tracking-wider">
                  {fmtBusId(bus.id)}
                </div>
                <div className="font-semibold text-gray-700 text-sm truncate">
                  {bus.registrationNumber}
                </div>
                <div className="text-gray-500 text-xs font-medium">{bus.busType}</div>
                <div className="text-gray-500 text-xs font-medium truncate pr-2">
                  {getRouteName(bus)}
                </div>
                <div className="text-gray-500 text-xs font-medium">{bus.totalSeats}</div>
                <div className="text-gray-400 text-xs font-semibold">
                  {fmtDate(bus.recordedAt)}
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[st]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[st]}`} />
                    {st}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => { setShowViewPwd(false); setViewBus(bus); }}
                    title="View details"
                    className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 flex items-center justify-center transition-all active:scale-90"
                  >
                    <IoEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(bus)}
                    title="Edit bus"
                    className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 flex items-center justify-center transition-all active:scale-90"
                  >
                    <IoPencil className="w-3.5 h-3.5" />
                  </button>
                  {bus.isActive ? (
                    <button
                      onClick={() => handleToggle(bus)}
                      title="Suspend bus"
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all active:scale-90"
                    >
                      <IoBan className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggle(bus)}
                      title="Reactivate bus"
                      className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 flex items-center justify-center transition-all active:scale-90"
                    >
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

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 relative max-h-[92vh] overflow-y-auto">

            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm"
            >✕</button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-[#122843] tracking-tight">
                {editingBus ? `Update ${fmtBusId(editingBus.id)}` : "New Bus Registration"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {editingBus
                  ? "Edit bus details and personnel"
                  : "Register a new bus to the fleet"}
              </p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
                <span className="mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* ── Bus Core Details ── */}
            <div className="grid grid-cols-2 gap-4 mb-5">

              <div className="col-span-2">
                <label className={labelCls}>License Plate (SL Format)</label>
                <input
                  className={ic("registrationNumber")}
                  placeholder="e.g. WP NC-1234"
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, registrationNumber: e.target.value.toUpperCase() }))
                  }
                />
                <FieldError msg={fe("registrationNumber")} />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Active Route</label>
                <select
                  className={ic("routeId")}
                  value={form.routeId ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      routeId: e.target.value ? parseInt(e.target.value, 10) : null,
                    }))
                  }
                >
                  <option value="">— Select a route —</option>
                  {routesLoading && <option disabled>Loading routes…</option>}
                  {!routesLoading && routes.length === 0 && (
                    <option disabled>No routes available</option>
                  )}
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName}
                      {r.from && r.to ? ` · ${r.from} → ${r.to}` : ""}
                    </option>
                  ))}
                </select>
                <FieldError msg={fe("routeId")} />
              </div>

              <div>
                <label className={labelCls}>Seating</label>
                <input
                  type="number"
                  className={ic("totalSeats")}
                  value={form.totalSeats}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, totalSeats: parseInt(e.target.value, 10) || 0 }))
                  }
                />
                <FieldError msg={fe("totalSeats")} />
              </div>

              <div>
                <label className={labelCls}>Last Service Date</label>
                <input
                  type="date"
                  className={ic("lastService")}
                  value={form.lastService}
                  onChange={(e) => setForm((f) => ({ ...f, lastService: e.target.value }))}
                />
                <FieldError msg={fe("lastService")} />
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select
                  className={inputNormal}
                  value={form.busType}
                  onChange={(e) => setForm((f) => ({ ...f, busType: e.target.value as BusType }))}
                >
                  {BUS_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select
                  className={inputNormal}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BusStatus }))}
                >
                  {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* ── Bus Owner Contact ── */}
            <div className="mb-5">
              <p className={`${labelCls} mb-3`}>Bus Owner Contact</p>
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["name", "nic", "email", "phone"] as const).map((field) => (
                    <div key={field}>
                      <label className={smLabelCls}>
                        {field === "nic"
                          ? "NIC"
                          : field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        className={sc(`owner.${field}`)}
                        placeholder={
                          field === "name"  ? "Kavindra Senarathne"
                          : field === "nic"   ? "199012345678 or 901234567V"
                          : field === "email" ? "email@routeme.lk"
                          : "07xxxxxxxx"
                        }
                        maxLength={
                          field === "phone" ? 10
                          : field === "nic" ? 12
                          : undefined
                        }
                        value={form.owner[field]}
                        onChange={(e) =>
                          updateOwner(
                            field,
                            field === "nic"
                              ? e.target.value.toUpperCase()
                              : e.target.value
                          )
                        }
                      />
                      <FieldError msg={fe(`owner.${field}`)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Driver Contact Details ── */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className={labelCls}>
                  Driver Contact Details{" "}
                  <span className="ml-1 text-gray-300 font-normal normal-case tracking-normal">
                    ({form.drivers.length}/3)
                  </span>
                </p>
                {form.drivers.length < 3 && (
                  <button
                    type="button"
                    onClick={addDriver}
                    className="text-xs font-bold text-[#4CAF8A] hover:text-[#3d9e7a] flex items-center gap-1 transition"
                  >
                    + Add Driver
                  </button>
                )}
              </div>

              {fe("drivers") && <FieldError msg={fe("drivers")} />}

              <div className="space-y-3">
                {form.drivers.map((driver, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-black text-gray-400">
                        Driver {idx + 1}
                      </span>
                      {form.drivers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDriver(idx)}
                          className="text-xs text-red-400 hover:text-red-600 font-bold transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {(["name", "nic"] as const).map((field) => (
                        <div key={field}>
                          <label className={smLabelCls}>
                            {field === "nic" ? "NIC" : "Name"}
                          </label>
                          <input
                            className={sc(`drivers.${idx}.${field}`)}
                            placeholder={
                              field === "name"
                                ? "Kavindra Senarathne"
                                : "199012345678 or 901234567V"
                            }
                            maxLength={field === "nic" ? 12 : undefined}
                            value={driver[field]}
                            onChange={(e) =>
                              updateDriver(
                                idx,
                                field,
                                field === "nic"
                                  ? e.target.value.toUpperCase()
                                  : e.target.value
                              )
                            }
                          />
                          <FieldError msg={fe(`drivers.${idx}.${field}`)} />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(["email", "phone"] as const).map((field) => (
                        <div key={field}>
                          <label className={smLabelCls}>
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                          </label>
                          <input
                            className={sc(`drivers.${idx}.${field}`)}
                            placeholder={field === "email" ? "email@routeme.lk" : "07xxxxxxxx"}
                            maxLength={field === "phone" ? 10 : undefined}
                            value={driver[field]}
                            onChange={(e) => updateDriver(idx, field, e.target.value)}
                          />
                          <FieldError msg={fe(`drivers.${idx}.${field}`)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Password ── */}
            <div className="mb-2">
              <label className={`${labelCls} mb-2`}>Bus Access Password</label>
              <div className="flex gap-2 mb-3">
                {(["auto", "custom"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPasswordMode(mode)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                      passwordMode === mode
                        ? "bg-[#122843] text-white border-[#122843]"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {mode === "auto" ? "✨ Auto-Generate" : "✏️ Custom Password"}
                  </button>
                ))}
              </div>

              {passwordMode === "auto" ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 border border-dashed border-[#4CAF8A] rounded-lg px-3 flex items-center justify-between bg-green-50">
                    <span className="text-sm font-mono text-[#122843] font-bold tracking-wider">
                      {showPassword ? autoPassword : "•".repeat(autoPassword.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPassword(generatePassword())}
                    className="h-10 px-3 rounded-lg bg-[#4CAF8A] text-white text-xs font-bold hover:bg-[#3d9e7a] transition"
                    title="Regenerate"
                  >
                    🔄
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={fe("password") ? inputError : inputNormal}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={
                      editingBus
                        ? "Leave blank to keep current password"
                        : "Min. 8 characters"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              )}
              <FieldError msg={fe("password")} />
              <p className="text-[10px] text-gray-400 mt-1.5">
                {passwordMode === "auto"
                  ? "A secure password has been generated. Share it with the assigned drivers."
                  : editingBus
                  ? "Leave blank to keep the existing password."
                  : "Enter a strong password with at least 8 characters."}
              </p>
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
                {editingBus ? "Save Changes" : "Register Bus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setViewBus(null)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm"
            >✕</button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FiTruck className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#122843] tracking-tight">
                  Bus Info: {fmtBusId(viewBus.id)}
                </h2>
                <p className="text-[11px] text-gray-400 font-mono font-bold tracking-widest mt-0.5">
                  {viewBus.registrationNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 bg-gray-50/80 p-5 rounded-xl border border-gray-100 mb-4">
              {[
                ["Bus ID",           fmtBusId(viewBus.id)],
                ["Plate Number",     viewBus.registrationNumber],
                ["Service Type",     viewBus.busType],
                ["Active Route",     getRouteName(viewBus)],
                ["Seating Capacity", `${viewBus.totalSeats} Seats`],
                ["Last Maintenance", fmtDate(viewBus.recordedAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">
                    {label}
                  </p>
                  <p className="font-bold text-gray-800 text-sm">{val}</p>
                </div>
              ))}

              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">
                  Fleet Status
                </p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[getBusStatus(viewBus)]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[getBusStatus(viewBus)]}`} />
                  {getBusStatus(viewBus)}
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">
                  Access Password
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-gray-800 tracking-wider text-sm">
                    {showViewPwd
                      ? (pwdMap[viewBus.id] ?? "Not available")
                      : "•".repeat((pwdMap[viewBus.id] ?? "••••••••••••").length)}
                  </p>
                  {pwdMap[viewBus.id] && (
                    <button
                      type="button"
                      onClick={() => setShowViewPwd((v) => !v)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      {showViewPwd ? "🙈" : "👁️"}
                    </button>
                  )}
                </div>
                {!pwdMap[viewBus.id] && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Password not available — set via Edit.
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">
                Bus Owner Contact
              </p>
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 grid grid-cols-2 gap-4">
                {[
                  ["Name",  viewBus.ownerName],
                  ["NIC",   viewBus.ownerNic],
                  ["Email", viewBus.ownerEmail],
                  ["Phone", viewBus.ownerPhone],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[9px] uppercase text-gray-400 mb-0.5 tracking-wide">{label}</p>
                    <p className="font-bold text-gray-800 text-sm break-all">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">
                Assigned Drivers ({viewBus.drivers?.length ?? 0})
              </p>
              <div className="space-y-3">
                {(viewBus.drivers ?? []).map((d, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-3 tracking-wide">
                      Driver {i + 1}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Name",  d.name],
                        ["NIC",   d.nic],
                        ["Email", d.email],
                        ["Phone", d.phone],
                      ].map(([lbl, val]) => (
                        <div key={lbl}>
                          <p className="text-[9px] uppercase text-gray-400 mb-0.5">{lbl}</p>
                          <p className="font-bold text-gray-800 text-sm break-all">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewBus(null)}
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