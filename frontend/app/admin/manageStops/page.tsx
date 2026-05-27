"use client";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { z, ZodIssue } from "zod";
import { IoSearch, IoAddCircle, IoLocationSharp } from "react-icons/io5";
import { FiMapPin, FiCheckCircle, FiAlertOctagon, FiEdit2 } from "react-icons/fi";
import { MdLocationOn, MdEditLocationAlt } from "react-icons/md";
import { TbMapPin } from "react-icons/tb";

// ─── Types ────────────────────────────────────────────────────────────────────
type StopsMapPickerProps = {
  formData: { stopName: string; longitude: string; latitude: string };
  setFormData: React.Dispatch<React.SetStateAction<{ stopName: string; longitude: string; latitude: string }>>;
};

const StopsMapPicker = dynamic<StopsMapPickerProps>(
  () => import("@/app/admin/manageStops/StopsMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        Loading map...
      </div>
    ),
  }
);

type Stop = {
  id: number;
  stopName: string;
  longitude: string;
  latitude: string;
  isActive: boolean;
};

type StopFormValues = {
  stopName: string;
  latitude: string;
  longitude: string;
};

type FieldErrors = Record<string, string>;

// ─── Axios instance ───────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const latRegex = /^-?([0-8]?[0-9](\.\d+)?|90(\.0+)?)$/;
const lngRegex = /^-?((1[0-7][0-9]|[0-9]{1,2})(\.\d+)?|180(\.0+)?)$/;

const stopFormSchema = z.object({
  stopName:  z.string().min(1, "Stop name is required").min(3, "Stop name must be at least 3 characters").max(150, "Stop name must be under 150 characters"),
  latitude:  z.string().min(1, "Latitude is required").regex(latRegex,  "Enter a valid latitude between -90 and 90"),
  longitude: z.string().min(1, "Longitude is required").regex(lngRegex, "Enter a valid longitude between -180 and 180"),
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputBase   = "w-full h-10 border rounded-lg px-3 text-sm outline-none transition bg-white text-black";
const inputNormal = `${inputBase} border-gray-200 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const inputError  = `${inputBase} border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/30`;
const labelCls    = "block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest";

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] text-red-500 font-semibold">{msg}</p>;
}

function StatCard({ icon, bg, value, label, color }: {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const flattenZodErrors = (issues: ZodIssue[]): FieldErrors => {
  const errs: FieldErrors = {};
  issues.forEach((e) => { const key = e.path.join("."); if (!errs[key]) errs[key] = e.message; });
  return errs;
};

const emptyForm = (): StopFormValues => ({ stopName: "", latitude: "", longitude: "" });

function formatStopId(rawId: number | string | null | undefined, prefix = "ST", width = 4): string {
  if (rawId === null || rawId === undefined) {
    return `${prefix}${"0".repeat(width)}`;
  }

  const text = String(rawId).trim();
  const trailingDigits = text.match(/(\d+)$/)?.[1] ?? text.replace(/\D/g, "");

  if (trailingDigits) {
    return `${prefix}${trailingDigits.padStart(width, "0")}`;
  }

  return text;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminManageStopsPage() {
  const [useMap,      setUseMap]      = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [formData,    setFormData]    = useState<StopFormValues>(emptyForm());
  const [search,      setSearch]      = useState("");
  const [editId,      setEditId]      = useState<number | null>(null);
  const [stops,       setStops]       = useState<Stop[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState("");

  // ── Load stops ──────────────────────────────────────────────────────────────
  const loadStops = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: { stops: Stop[] } }>("/stops");
      setStops(data.data.stops);
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStops(); }, [loadStops]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalStops    = stops.length;
  const activeStops   = stops.filter((s) => s.isActive).length;
  const inactiveStops = stops.filter((s) => !s.isActive).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const openAddModal = () => {
    setEditId(null); setFormData(emptyForm()); setUseMap(false);
    setFieldErrors({}); setApiError(""); setShowModal(true);
  };

  const openEditModal = (stop: Stop) => {
    setEditId(stop.id);
    setFormData({ stopName: stop.stopName, longitude: stop.longitude, latitude: stop.latitude });
    setUseMap(false); setFieldErrors({}); setApiError(""); setShowModal(true);
  };

  const handleSubmit = async () => {
    const result = stopFormSchema.safeParse(formData);
    if (!result.success) { setFieldErrors(flattenZodErrors(result.error.issues)); return; }
    setFieldErrors({}); setApiError("");
    try {
      if (editId !== null) {
        await api.put(`/stops/${editId}`, formData);
        toast.success("Stop updated successfully");
      } else {
        await api.post("/stops", formData);
        toast.success(`${formData.stopName} added successfully`);
      }
      await loadStops();
      setFormData(emptyForm()); setShowModal(false); setEditId(null);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Save failed";
      setApiError(msg); toast.error(msg);
    }
  };

  const handleToggleActive = async (id: number) => {
    const stopToUpdate = stops.find((s) => s.id === id);
    if (!stopToUpdate) return;
    const nextActive = !stopToUpdate.isActive;
    const confirmed = await Swal.fire({
      title: `${nextActive ? "Activate" : "Suspend"} this stop?`,
      text: `"${stopToUpdate.stopName}" will be marked as ${nextActive ? "active" : "suspended"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nextActive ? "#16a34a" : "#d97706",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${nextActive ? "activate" : "suspend"}`,
    });
    if (!confirmed.isConfirmed) return;
    try {
      await api.patch(`/stops/${id}/toggle`);
      await loadStops();
      toast.success(`"${stopToUpdate.stopName}" ${nextActive ? "activated" : "suspended"}`);
    } catch {
      toast.error("Failed to update stop status");
    }
  };

  const filteredStops = stops.filter((s) =>
    s.stopName.toLowerCase().includes(search.toLowerCase())
  );

  const fe = (key: string) => fieldErrors[key];
  const ic = (key: string) => (fe(key) ? inputError : inputNormal);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-full">

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<IoLocationSharp className="w-6 h-6 text-blue-500" />}
          bg="bg-blue-50" value={totalStops} label="Total Stops" color="text-blue-600" />
        <StatCard
          icon={<FiCheckCircle className="w-6 h-6 text-emerald-500" />}
          bg="bg-emerald-50" value={activeStops} label="Active Stops" color="text-emerald-600" />
        <StatCard
          icon={<FiAlertOctagon className="w-6 h-6 text-amber-500" />}
          bg="bg-amber-50" value={inactiveStops} label="Suspended Stops" color="text-amber-600" />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-72 shadow-sm">
          <IoSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search stops..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={openAddModal}
          className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
        >
          <IoAddCircle className="w-4 h-4" />
          Add Stop
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="grid grid-cols-[60px_1fr_120px_120px_110px_110px] bg-[#f8fafc] px-5 py-3 text-[11px] font-black text-gray-500 border-b uppercase tracking-widest">
              <div>Stop ID</div>
              <div className="ml-5">Stop Name</div>
              <div>Latitude</div>
              <div>Longitude</div>
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
            <span className="text-sm font-semibold">Loading stops…</span>
          </div>
        ) : filteredStops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
            <FiMapPin className="w-8 h-8 opacity-30" />
            <p className="text-sm font-semibold">No stops found.</p>
          </div>
        ) : (
          filteredStops.map((stop, idx) => (
            <div
              key={stop.id}
              className={`grid grid-cols-[60px_1fr_120px_120px_110px_110px] items-center px-5 py-3.5 border-b transition-colors duration-150 ${
                idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              } hover:bg-blue-50/30`}
            >
              <div className="font-mono text-[11px] font-bold text-gray-400 tracking-wider">
                {formatStopId(stop.id)}
              </div>

              <div className="flex items-center gap-2 min-w-0 ml-5">
                
                <span className="font-semibold text-gray-800 text-sm truncate">{stop.stopName}</span>
              </div>

              <div className="font-mono text-xs text-gray-500">{stop.latitude}</div>
              <div className="font-mono text-xs text-gray-500">{stop.longitude}</div>

              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  stop.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stop.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {stop.isActive ? "Active" : "Suspended"}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => openEditModal(stop)}
                  title="Edit stop"
                  className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 flex items-center justify-center transition-all active:scale-90"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleToggleActive(stop.id)}
                  title={stop.isActive ? "Suspend stop" : "Activate stop"}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                    stop.isActive ? "bg-emerald-400 border-emerald-400" : "bg-slate-200 border-slate-300"
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    stop.isActive ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
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
                {editId !== null
                  ? <MdEditLocationAlt className="w-6 h-6 text-white" />
                  : <TbMapPin className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-[#122843] tracking-tight">
                  {editId !== null ? "Edit Stop" : "New Stop Registration"}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {editId !== null ? "Update stop details" : "Add a new bus stop to the network"}
                </p>
              </div>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
                <span className="mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <div className="space-y-4">

              <div>
                <label className={labelCls}>Stop Name</label>
                <input
                  type="text"
                  name="stopName"
                  placeholder="e.g. Colombo Fort"
                  value={formData.stopName}
                  onChange={handleChange}
                  className={ic("stopName")}
                />
                <FieldError msg={fe("stopName")} />
              </div>

              <div>
                <label className={labelCls}>Location Input Method</label>
                <div className="flex gap-2">
                  {(["manual", "map"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setUseMap(mode === "map")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold border-2 transition flex items-center justify-center gap-2 ${
                        (mode === "map") === useMap
                          ? "bg-[#122843] text-white border-[#122843]"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {mode === "manual"
                        ? <><FiEdit2 className="w-3.5 h-3.5" /> Enter Manually</>
                        : <><FiMapPin className="w-3.5 h-3.5" /> Pick from Map</>}
                    </button>
                  ))}
                </div>
              </div>

              {useMap && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <StopsMapPicker formData={formData} setFormData={setFormData} />
                  <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 flex items-center gap-1.5">
                    <IoLocationSharp className="w-3.5 h-3.5 text-[#4CAF8A]" />
                    Click on the map to set the stop location.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    placeholder="6.9271"
                    value={formData.latitude}
                    onChange={handleChange}
                    readOnly={useMap}
                    className={`${ic("latitude")} ${useMap ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  <FieldError msg={fe("latitude")} />
                </div>
                <div>
                  <label className={labelCls}>Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    placeholder="79.8612"
                    value={formData.longitude}
                    onChange={handleChange}
                    readOnly={useMap}
                    className={`${ic("longitude")} ${useMap ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  <FieldError msg={fe("longitude")} />
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
                onClick={handleSubmit}
                className="px-8 py-2 rounded-xl bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition active:scale-95"
              >
                Save Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}