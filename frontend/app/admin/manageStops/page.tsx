"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { z, ZodIssue } from "zod";
import { IoAddCircle, IoLocationSharp } from "react-icons/io5";
import { FiMapPin, FiCheckCircle, FiAlertOctagon, FiEdit2 } from "react-icons/fi";
import { MdEditLocationAlt } from "react-icons/md";
import { TbMapPin } from "react-icons/tb";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { IoCheckmarkCircle, IoBan } from "react-icons/io5";

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

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const latRegex = /^-?([0-8]?[0-9](\.\d+)?|90(\.0+)?)$/;
const lngRegex = /^-?((1[0-7][0-9]|[0-9]{1,2})(\.\d+)?|180(\.0+)?)$/;

const stopFormSchema = z.object({
  stopName:  z.string().min(1, "Stop name is required").min(3, "Stop name must be at least 3 characters").max(150, "Stop name must be under 150 characters"),
  latitude:  z.string().min(1, "Latitude is required").regex(latRegex, "Enter a valid latitude between -90 and 90"),
  longitude: z.string().min(1, "Longitude is required").regex(lngRegex, "Enter a valid longitude between -180 and 180"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const flattenZodErrors = (issues: ZodIssue[]): FieldErrors => {
  const errs: FieldErrors = {};
  issues.forEach((e) => { const key = e.path.join("."); if (!errs[key]) errs[key] = e.message; });
  return errs;
};

const emptyForm = (): StopFormValues => ({ stopName: "", latitude: "", longitude: "" });

function formatStopId(rawId: number | string | null | undefined, prefix = "ST", width = 4): string {
  if (rawId === null || rawId === undefined) return `${prefix}${"0".repeat(width)}`;
  const text = String(rawId).trim();
  const trailingDigits = text.match(/(\d+)$/)?.[1] ?? text.replace(/\D/g, "");
  if (trailingDigits) return `${prefix}${trailingDigits.padStart(width, "0")}`;
  return text;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500 font-semibold">{msg}</p>;
}

function StatCard({ icon, bg, value, label, color }: {
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

// ─── Input styles ─────────────────────────────────────────────────────────────
const inputBase   = "w-full h-10 border rounded-md px-2 text-sm outline-none transition bg-white text-black";
const inputNormal = `${inputBase} border-[#828282]/70 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const inputError  = `${inputBase} border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/20`;
const labelCls    = "block mb-2 font-semibold text-sm text-gray-700";

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
  const [submitting,  setSubmitting]  = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string;
    confirmLabel: string; confirmClass: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmLabel: "", confirmClass: "", onConfirm: () => {} });

  // ── Load stops ─────────────────────────────────────────────────────────────
  const loadStops = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ stops: Stop[] }>("/stops");
      setStops(res.stops ?? []);
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
    setSubmitting(true);
    try {
      if (editId !== null) {
        await apiFetch(`/stops/${editId}`, { method: "PUT", body: JSON.stringify(formData) });
        toast.success("Stop updated successfully");
      } else {
        await apiFetch("/stops", { method: "POST", body: JSON.stringify(formData) });
        toast.success(`${formData.stopName} added successfully`);
      }
      await loadStops();
      setFormData(emptyForm()); setShowModal(false); setEditId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setApiError(msg); toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = (stop: Stop) => {
    const nextActive = !stop.isActive;
    setConfirmState({
      open: true,
      title: `${nextActive ? "Activate" : "Suspend"} this stop?`,
      message: `"${stop.stopName}" will be marked as ${nextActive ? "active" : "suspended"}.`,
      confirmLabel: `Yes, ${nextActive ? "activate" : "suspend"}`,
      confirmClass: nextActive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await apiFetch(`/stops/${stop.id}/toggle`, { method: "PATCH" });
          await loadStops();
          toast.success(`"${stop.stopName}" ${nextActive ? "activated" : "suspended"}`);
        } catch {
          toast.error("Failed to update stop status");
        }
      },
    });
  };

  const filteredStops = stops.filter((s) =>
    s.stopName.toLowerCase().includes(search.toLowerCase())
  );

  const fe = (key: string) => fieldErrors[key];
  const ic = (key: string) => (fe(key) ? inputError : inputNormal);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <section className="p-6">

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<IoLocationSharp className="w-5 h-5 text-blue-500"    />}
            bg="bg-blue-50"    value={totalStops}    label="Total Stops"      color="text-blue-600"    />
          <StatCard
            icon={<FiCheckCircle  className="w-5 h-5 text-emerald-500" />}
            bg="bg-emerald-50" value={activeStops}   label="Active Stops"     color="text-emerald-600" />
          <StatCard
            icon={<FiAlertOctagon className="w-5 h-5 text-amber-500"   />}
            bg="bg-amber-50"   value={inactiveStops} label="Suspended Stops"  color="text-amber-600"   />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="rounded-xl border border-gray-100 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
              <FaMagnifyingGlass className="w-4 h-4 opacity-50" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search stops..."
                className="flex-1 text-sm bg-transparent outline-none text-black"
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
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-max md:min-w-full">

              {/* Header */}
              <div className="grid grid-cols-[100px_1fr_130px_130px_100px_116px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
                <div>Stop ID</div>
                <div className="ml-2">Stop Name</div>
                <div>Latitude</div>
                <div>Longitude</div>
                <div>Status</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Body */}
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading stops...</div>
              ) : filteredStops.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No stops found</div>
              ) : (
                filteredStops.map((stop) => (
                  <div key={stop.id}
                    className="grid grid-cols-[100px_1fr_130px_130px_100px_116px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">

                    <div className="font-semibold text-[#122843] whitespace-nowrap">
                      {formatStopId(stop.id)}
                    </div>

                    <div className="flex items-center gap-2 min-w-0 ml-2">
                      <span className="font-medium text-gray-800 truncate text-sm">{stop.stopName}</span>
                    </div>

                    <div className="font-mono text-xs text-gray-500">{stop.latitude}</div>
                    <div className="font-mono text-xs text-gray-500">{stop.longitude}</div>

                    <div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        stop.isActive ? "bg-emerald-600 text-white" : "bg-amber-400 text-white"
                      }`}>
                        {stop.isActive ? "Active" : "Suspended"}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => openEditModal(stop)} title="Edit stop"
                        className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition">
                        <FiEdit2 className="text-amber-500 w-3.5 h-3.5" />
                      </button>
                      {stop.isActive ? (
                        <button onClick={() => handleToggleActive(stop)} title="Suspend stop"
                          className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition">
                          <IoBan className="text-red-400 w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleToggleActive(stop)} title="Activate stop"
                          className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 shadow-sm transition">
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
          <div className="relative mx-4 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button type="button" aria-label="Close modal" onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white">
              <FaXmark />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#122843] flex items-center justify-center flex-shrink-0">
                {editId !== null
                  ? <MdEditLocationAlt className="w-5 h-5 text-white" />
                  : <TbMapPin className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {editId !== null ? "Edit Stop" : "Add New Stop"}
                </h3>
                <p className="text-xs text-gray-500">
                  {editId !== null ? "Update stop details" : "Add a new bus stop to the network"}
                </p>
              </div>
            </div>

            <p className="mb-4 text-xs text-gray-500">
              Fields marked with <span className="text-red-600">*</span> are mandatory.
            </p>

            {apiError && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <span className="mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">

              <div>
                <label className={labelCls}>Stop Name <span className="text-red-600">*</span></label>
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
                    <button key={mode} type="button" onClick={() => setUseMap(mode === "map")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 ${
                        (mode === "map") === useMap
                          ? "bg-[#122843] text-white border-[#122843]"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}>
                      {mode === "manual"
                        ? <><FiEdit2 className="w-3.5 h-3.5" /> Enter Manually</>
                        : <><FiMapPin className="w-3.5 h-3.5" /> Pick from Map</>}
                    </button>
                  ))}
                </div>
              </div>

              {useMap && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <StopsMapPicker formData={formData} setFormData={setFormData} />
                  <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 flex items-center gap-1.5">
                    <IoLocationSharp className="w-3.5 h-3.5 text-[#4CAF8A]" />
                    Click on the map to set the stop location.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Latitude <span className="text-red-600">*</span></label>
                  <input
                    type="text" name="latitude" placeholder="6.9271"
                    value={formData.latitude} onChange={handleChange}
                    readOnly={useMap}
                    className={`${ic("latitude")} ${useMap ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  <FieldError msg={fe("latitude")} />
                </div>
                <div>
                  <label className={labelCls}>Longitude <span className="text-red-600">*</span></label>
                  <input
                    type="text" name="longitude" placeholder="79.8612"
                    value={formData.longitude} onChange={handleChange}
                    readOnly={useMap}
                    className={`${ic("longitude")} ${useMap ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  <FieldError msg={fe("longitude")} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)}
                className="rounded-md bg-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-400 transition">
                Cancel
              </button>
              <button type="button" disabled={submitting} onClick={handleSubmit}
                className="rounded-xl bg-[#f5a623] hover:bg-[#e09510] px-8 py-2 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-gray-400 active:scale-95">
                {submitting ? "Saving..." : editId !== null ? "Save Changes" : "Add Stop"}
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