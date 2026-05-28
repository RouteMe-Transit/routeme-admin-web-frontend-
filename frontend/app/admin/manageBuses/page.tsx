"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { z, ZodIssue } from "zod";
import {
  IoEye,
  IoPencil,
  IoBan,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { FiTruck, FiTool, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { MdVerified } from "react-icons/md";

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
    .max(3, "Maximum 3 drivers"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const busEditSchema = busFormSchema.extend({
  routeId:  routeIdSchema,
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 8, "Password must be at least 8 characters"),
});

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
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

const fmtBusId = (id: number) => `BUS${String(id).padStart(4, "0")}`;

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

const STATUS_BADGE: Record<BusStatus, string> = {
  Active:      "bg-emerald-600 text-white",
  Maintenance: "bg-amber-400  text-white",
  Breakdown:   "bg-red-500    text-white",
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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500 font-semibold">{msg}</p>;
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
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

// ─── Input styles ─────────────────────────────────────────────────────────────
const inputBase   = "w-full h-10 border rounded-md px-2 text-sm outline-none transition bg-white";
const inputNormal = `${inputBase} border-[#828282]/70 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const inputErr    = `${inputBase} border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/20`;
const labelCls    = "block mb-2 font-semibold text-sm text-gray-700";

const smInputBase = "w-full h-9 border rounded-md px-2 text-xs outline-none transition bg-white";
const smInputNorm = `${smInputBase} border-[#828282]/70 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const smInputErr  = `${smInputBase} border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/20`;
const smLabelCls  = "block mb-1 font-semibold text-xs text-gray-600";

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminManageBuses() {
  const [buses,         setBuses]         = useState<Bus[]>([]);
  const [routes,        setRoutes]        = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<BusStatus | "">("");

  const [statusMap, setStatusMap] = useState<Record<number, BusStatus>>({});

  const [showModal,  setShowModal]  = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [viewBus,    setViewBus]    = useState<Bus | null>(null);

  const [form,        setForm]        = useState<BusFormValues>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const [passwordMode, setPasswordMode] = useState<"auto" | "custom">("auto");
  const [autoPassword, setAutoPassword] = useState(generatePassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPwd,  setShowViewPwd]  = useState(false);
  const [pwdMap,       setPwdMap]       = useState<Record<number, string>>({});

  // ── Confirm modal state ───────────────────────────────────────────────────
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

  // ── Load buses ────────────────────────────────────────────────────────────
  const loadBuses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ total: number; buses: Bus[] }>("/buses?limit=200");
      const rows = res.buses ?? [];
      setBuses(rows);
      setStatusMap((prev) => {
        const next = { ...prev };
        rows.forEach((b) => {
          if (next[b.id] === undefined)
            next[b.id] = b.isActive ? "Active" : "Maintenance";
        });
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load buses");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load routes ───────────────────────────────────────────────────────────
  const loadRoutes = useCallback(async () => {
    try {
      setRoutesLoading(true);
      const res = await apiFetch<{ routes: Route[] }>("/routes?limit=200");
      setRoutes(res.routes ?? []);
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

  // ── Derived ───────────────────────────────────────────────────────────────
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
    const matchStatus = statusFilter === "" || st === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Zod error flattener ───────────────────────────────────────────────────
  const flattenZodErrors = (issues: ZodIssue[]): FieldErrors => {
    const errs: FieldErrors = {};
    issues.forEach((e) => {
      const key = e.path.join(".");
      if (!errs[key]) errs[key] = e.message;
    });
    return errs;
  };

  const fe = (key: string) => fieldErrors[key];
  const ic = (key: string) => (fe(key) ? inputErr    : inputNormal);
  const sc = (key: string) => (fe(key) ? smInputErr  : smInputNorm);

  // ── Modal helpers ─────────────────────────────────────────────────────────
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

  // ── Owner / Driver field updaters ─────────────────────────────────────────
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

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const finalPassword =
      passwordMode === "auto"
        ? editingBus
          ? ""
          : autoPassword
        : form.password;

    const payload = { ...form, password: finalPassword };
    const schema  = editingBus ? busEditSchema : busFormSchema;
    const result  = schema.safeParse(payload);

    if (!result.success) {
      const errs = flattenZodErrors(result.error.issues);
      setFieldErrors(errs);
      toast.error(result.error.issues[0]?.message ?? "Please fix the errors");
      return;
    }

    setFieldErrors({});
    setApiError("");
    setSubmitting(true);

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
        await apiFetch(`/buses/${editingBus.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setStatusMap((m) => ({ ...m, [editingBus.id]: form.status }));
        if (finalPassword) setPwdMap((m) => ({ ...m, [editingBus.id]: finalPassword }));
        toast.success("Bus updated successfully");
      } else {
        const res = await apiFetch<{ id: number }>("/buses", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const newId = res?.id ?? Date.now();
        setStatusMap((m) => ({ ...m, [newId]: form.status }));
        if (finalPassword) setPwdMap((m) => ({ ...m, [newId]: finalPassword }));
        toast.success("Bus registered successfully");
      }
      await loadBuses();
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
  const handleToggle = (bus: Bus) => {
    const isActive = bus.isActive;
    setConfirmState({
      open: true,
      title: `${isActive ? "Suspend" : "Reactivate"} ${fmtBusId(bus.id)}?`,
      message: isActive
        ? "This bus will be deactivated."
        : "This bus will be restored to service.",
      confirmLabel: isActive ? "Yes, suspend" : "Yes, reactivate",
      confirmClass: isActive
        ? "bg-red-500 hover:bg-red-600"
        : "bg-emerald-500 hover:bg-emerald-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await apiFetch(`/buses/${bus.id}/toggle`, { method: "PATCH" });
          await loadBuses();
          toast.success(isActive ? "Bus suspended" : "Bus reactivated");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        }
      },
    });
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <section className="p-6">

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FiTruck         className="w-5 h-5 text-blue-500"    />}
            bg="bg-blue-50"    value={totalFleet}    label="Total Fleet"    color="text-blue-600"    />
          <StatCard
            icon={<FiTool          className="w-5 h-5 text-amber-500"   />}
            bg="bg-amber-50"   value={inMaintenance} label="In Maintenance" color="text-amber-600"   />
          <StatCard
            icon={<FiAlertTriangle className="w-5 h-5 text-red-400"    />}
            bg="bg-red-50"     value={breakdowns}    label="Breakdowns"     color="text-red-500"     />
          <StatCard
            icon={<FiCheckCircle   className="w-5 h-5 text-emerald-500" />}
            bg="bg-emerald-50" value={operational}   label="Operational"    color="text-emerald-600" />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="rounded-xl border border-gray-100 mb-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
              <FaMagnifyingGlass className="w-4 h-4 opacity-50" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search bus, plate or driver…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-black"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Add Bus */}
            <button
              onClick={openAddModal}
              className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
            >
              <FiTruck className="w-4 h-4" />
              Add Bus
            </button>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-max md:min-w-full">

              {/* Header — removed Last Service column */}
              <div className="grid grid-cols-[100px_130px_110px_160px_70px_110px_116px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
                <div>Bus ID</div>
                <div>Plate</div>
                <div>Type</div>
                <div>Route</div>
                <div>Seats</div>
                <div>Status</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading buses...</div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No buses found</div>
              ) : (
                filtered.map((bus) => {
                  const st = getBusStatus(bus);
                  return (
                    <div
                      key={bus.id}
                      className="grid grid-cols-[100px_130px_110px_160px_70px_110px_116px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
                    >
                      {/* Bus ID */}
                      <div className="font-semibold text-[#122843] whitespace-nowrap">
                        {fmtBusId(bus.id)}
                      </div>

                      {/* Plate */}
                      <div className="font-medium text-gray-800 truncate text-sm">
                        {bus.registrationNumber}
                      </div>

                      {/* Type */}
                      <div className="text-gray-600 text-sm">{bus.busType}</div>

                      {/* Route */}
                      <div className="text-gray-600 text-sm truncate pr-2">
                        {getRouteName(bus)}
                      </div>

                      {/* Seats */}
                      <div className="text-gray-600 text-sm">{bus.totalSeats}</div>

                      {/* Status badge */}
                      <div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_BADGE[st]}`}>
                          {st}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setShowViewPwd(false); setViewBus(bus); }}
                          title="View details"
                          className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition"
                        >
                          <IoEye className="text-blue-600 w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(bus)}
                          title="Edit bus"
                          className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition"
                        >
                          <IoPencil className="text-amber-500 w-3.5 h-3.5" />
                        </button>
                        {bus.isActive ? (
                          <button
                            onClick={() => handleToggle(bus)}
                            title="Suspend bus"
                            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition"
                          >
                            <IoBan className="text-red-400 w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(bus)}
                            title="Reactivate bus"
                            className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 shadow-sm transition"
                          >
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FaXmark />
            </button>

            <h3 className="mb-1 text-lg font-bold text-gray-800">
              {editingBus ? `Update ${fmtBusId(editingBus.id)}` : "Add New Bus"}
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {editingBus
                ? "Edit bus details and personnel"
                : "Register a new bus to the fleet"}
            </p>
            <p className="mb-4 text-xs text-gray-500">
              Fields marked with <span className="text-red-600">*</span> are mandatory.
            </p>

            {/* API error */}
            {apiError && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <span className="mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">

              {/* License Plate */}
              <div>
                <label className={labelCls}>License Plate <span className="text-red-600">*</span></label>
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

              {/* Active Route */}
              <div>
                <label className={labelCls}>Active Route <span className="text-red-600">*</span></label>
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

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category <span className="text-red-600">*</span></label>
                  <select
                    className={inputNormal}
                    value={form.busType}
                    onChange={(e) => setForm((f) => ({ ...f, busType: e.target.value as BusType }))}
                  >
                    {BUS_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status <span className="text-red-600">*</span></label>
                  <select
                    className={inputNormal}
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BusStatus }))}
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Seats + Last Service */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Seating Capacity <span className="text-red-600">*</span></label>
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
                  <label className={labelCls}>Last Service Date <span className="text-red-600">*</span></label>
                  <input
                    type="date"
                    className={ic("lastService")}
                    value={form.lastService}
                    onChange={(e) => setForm((f) => ({ ...f, lastService: e.target.value }))}
                  />
                  <FieldError msg={fe("lastService")} />
                </div>
              </div>

              {/* ── Bus Owner ── */}
              <div>
                <p className="mb-2 font-semibold text-sm text-gray-700">
                  Bus Owner Contact <span className="text-red-600">*</span>
                </p>
                <div className="rounded-md border border-blue-100 bg-blue-50/40 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(["name", "nic", "email", "phone"] as const).map((field) => (
                      <div key={field}>
                        <label className={smLabelCls}>
                          {field === "nic" ? "NIC" : field.charAt(0).toUpperCase() + field.slice(1)}
                        </label>
                        <input
                          className={sc(`owner.${field}`)}
                          placeholder={
                            field === "name"  ? "Kavindra Senarathne"
                            : field === "nic"   ? "199012345678 or 901234567V"
                            : field === "email" ? "email@routeme.lk"
                            : "07xxxxxxxx"
                          }
                          maxLength={field === "phone" ? 10 : field === "nic" ? 12 : undefined}
                          value={form.owner[field]}
                          onChange={(e) =>
                            updateOwner(
                              field,
                              field === "nic" ? e.target.value.toUpperCase() : e.target.value
                            )
                          }
                        />
                        <FieldError msg={fe(`owner.${field}`)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Drivers ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-700">
                    Driver Details <span className="text-red-600">*</span>{" "}
                    <span className="text-gray-400 font-normal">({form.drivers.length}/3)</span>
                  </p>
                  {form.drivers.length < 3 && (
                    <button
                      type="button"
                      onClick={addDriver}
                      className="text-xs font-bold text-[#4CAF8A] hover:text-[#3d9e7a] transition"
                    >
                      + Add Driver
                    </button>
                  )}
                </div>

                {fe("drivers") && <FieldError msg={fe("drivers")} />}

                <div className="space-y-3">
                  {form.drivers.map((driver, idx) => (
                    <div key={idx} className="rounded-md border border-gray-200 bg-gray-50/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">
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
                      <div className="grid grid-cols-2 gap-3">
                        {(["name", "nic", "email", "phone"] as const).map((field) => (
                          <div key={field}>
                            <label className={smLabelCls}>
                              {field === "nic" ? "NIC" : field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                            <input
                              className={sc(`drivers.${idx}.${field}`)}
                              placeholder={
                                field === "name"  ? "Kavindra Senarathne"
                                : field === "nic"   ? "199012345678 or 901234567V"
                                : field === "email" ? "email@routeme.lk"
                                : "07xxxxxxxx"
                              }
                              maxLength={field === "phone" ? 10 : field === "nic" ? 12 : undefined}
                              value={driver[field]}
                              onChange={(e) =>
                                updateDriver(
                                  idx,
                                  field,
                                  field === "nic" ? e.target.value.toUpperCase() : e.target.value
                                )
                              }
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
              <div>
                <label className={labelCls}>
                  {editingBus ? "Password" : <>Bus Access Password <span className="text-red-600">*</span></>}
                </label>

                <div className="flex gap-2 mb-3">
                  {(["auto", "custom"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPasswordMode(mode);
                        setFieldErrors((e) => { const { password: _, ...rest } = e; return rest; });
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        passwordMode === mode
                          ? "bg-[#122843] text-white border-[#122843]"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {editingBus
                        ? mode === "auto" ? "🔒 Keep Existing" : "✏️ Set New Password"
                        : mode === "auto" ? "✨ Auto-Generate" : "✏️ Custom Password"}
                    </button>
                  ))}
                </div>

                {passwordMode === "auto" && !editingBus && (
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
                      title="Regenerate password"
                    >
                      🔄
                    </button>
                  </div>
                )}

                {passwordMode === "auto" && editingBus && (
                  <div className="h-10 border border-dashed border-gray-300 rounded-lg px-3 flex items-center bg-gray-50">
                    <span className="text-xs text-gray-400 italic">
                      Existing password will remain unchanged
                    </span>
                  </div>
                )}

                {passwordMode === "custom" && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={fe("password") ? inputErr : inputNormal}
                      placeholder={
                        editingBus
                          ? "Enter new password (min. 8 chars)"
                          : "Min. 8 chars"
                      }
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
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
                  {!editingBus && passwordMode === "auto"
                    ? "A secure password has been generated. Share it with the assigned drivers."
                    : !editingBus && passwordMode === "custom"
                    ? "Enter a strong password with at least 8 characters."
                    : editingBus && passwordMode === "auto"
                    ? "The existing password will remain unchanged."
                    : "Enter a new password with at least 8 characters."}
                </p>
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
                {submitting
                  ? "Saving..."
                  : editingBus ? "Save Changes" : "Register Bus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button
              type="button"
              aria-label="Close view modal"
              onClick={() => setViewBus(null)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FaXmark />
            </button>

            <h3 className="mb-5 text-lg font-bold text-gray-800">Bus Details</h3>

            {/* Header row */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-md">
                <FiTruck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[#122843]">
                    {viewBus.registrationNumber}
                  </h2>
                  {viewBus.isActive && (
                    <MdVerified className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  {fmtBusId(viewBus.id)}
                </p>
              </div>
            </div>

            {/* Core info */}
            <div className="space-y-2 text-sm text-gray-700 mb-4">
              <p><strong>Bus ID:</strong> {fmtBusId(viewBus.id)}</p>
              <p><strong>Plate:</strong> {viewBus.registrationNumber}</p>
              <p><strong>Type:</strong> {viewBus.busType}</p>
              <p><strong>Route:</strong> {getRouteName(viewBus)}</p>
              <p><strong>Seats:</strong> {viewBus.totalSeats}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${STATUS_BADGE[getBusStatus(viewBus)]}`}>
                  {getBusStatus(viewBus)}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <strong>Password:</strong>
                <span className="font-mono font-bold text-gray-800 tracking-wider">
                  {showViewPwd
                    ? (pwdMap[viewBus.id] ?? "Not available")
                    : "•".repeat((pwdMap[viewBus.id] ?? "••••••••••••").length)}
                </span>
                {pwdMap[viewBus.id] && (
                  <button
                    type="button"
                    onClick={() => setShowViewPwd((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showViewPwd ? "🙈" : "👁️"}
                  </button>
                )}
                {!pwdMap[viewBus.id] && (
                  <span className="text-[10px] text-gray-400 italic">
                    Set via Edit
                  </span>
                )}
              </div>
            </div>

            {/* Owner */}
            <div className="mt-4 rounded-md bg-blue-50/60 border border-blue-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Bus Owner</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <p><strong>Name:</strong> {viewBus.ownerName}</p>
                <p><strong>NIC:</strong> {viewBus.ownerNic}</p>
                <p><strong>Email:</strong> {viewBus.ownerEmail}</p>
                <p><strong>Phone:</strong> {viewBus.ownerPhone}</p>
              </div>
            </div>

            {/* Drivers */}
            <div className="mt-4 rounded-md bg-gray-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                Assigned Drivers ({viewBus.drivers?.length ?? 0})
              </p>
              {(viewBus.drivers ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 italic">No drivers assigned.</p>
              ) : (
                <div className="space-y-3">
                  {(viewBus.drivers ?? []).map((d, i) => (
                    <div key={i} className="bg-white rounded-md border border-gray-200 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                        Driver {i + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-700">
                        <p><strong>Name:</strong> {d.name}</p>
                        <p><strong>NIC:</strong> {d.nic}</p>
                        <p><strong>Email:</strong> {d.email}</p>
                        <p><strong>Phone:</strong> {d.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewBus(null)}
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