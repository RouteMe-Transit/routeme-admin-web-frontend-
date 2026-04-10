
"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type RouteStatus = "Active" | "Maintenance" | "Breakdown";

type Stop = {
  id: string;
  name: string;
  timeFromStart: string;
};

type Route = {
  id: string;
  name: string;
  from: string;
  to: string;
  stops: number;
  buses: number;
  avgTime: string;
  status: RouteStatus;
  stopList: Stop[];
};

const initialRoutes: Route[] = [
  {
    id: "RT-001", name: "Route 138", from: "Colombo Fort", to: "Maharagama",
    stops: 12, buses: 18, avgTime: "45 min", status: "Active",
    stopList: [
      { id: "01", name: "Colombo Fort", timeFromStart: "00.00" },
      { id: "02", name: "Slave Island", timeFromStart: "00.05" },
      { id: "03", name: "Kollupitiya", timeFromStart: "00.10" },
      { id: "04", name: "Bambalapitiya", timeFromStart: "00.15" },
      { id: "05", name: "Wellawatte", timeFromStart: "00.20" },
      { id: "06", name: "Dehiwala", timeFromStart: "00.25" },
      { id: "07", name: "Mount Lavinia", timeFromStart: "00.30" },
      { id: "08", name: "Ratmalana", timeFromStart: "00.33" },
      { id: "09", name: "Piliyandala Junction", timeFromStart: "00.37" },
      { id: "10", name: "Kesbewa Road", timeFromStart: "00.40" },
      { id: "11", name: "Boralesgamuwa", timeFromStart: "00.43" },
      { id: "12", name: "Maharagama", timeFromStart: "00.45" },
    ],
  },
  {
    id: "RT-002", name: "Route 120", from: "Colombo Fort", to: "Kesbewa",
    stops: 20, buses: 25, avgTime: "1 hr 10 min", status: "Active",
    stopList: [
      { id: "01", name: "Colombo Fort", timeFromStart: "00.00" },
      { id: "02", name: "Maradana", timeFromStart: "00.05" },
      { id: "03", name: "Borella", timeFromStart: "00.10" },
      { id: "04", name: "Narahenpita", timeFromStart: "00.15" },
      { id: "05", name: "Kirula", timeFromStart: "00.18" },
      { id: "06", name: "Nugegoda", timeFromStart: "00.23" },
      { id: "07", name: "Gangodawila", timeFromStart: "00.28" },
      { id: "08", name: "Pitakotte", timeFromStart: "00.32" },
      { id: "09", name: "Thalawathugoda", timeFromStart: "00.36" },
      { id: "10", name: "Hokandara", timeFromStart: "00.40" },
      { id: "11", name: "Athurugiriya", timeFromStart: "00.44" },
      { id: "12", name: "Malabe", timeFromStart: "00.48" },
      { id: "13", name: "Koswatta", timeFromStart: "00.51" },
      { id: "14", name: "Battaramulla South", timeFromStart: "00.54" },
      { id: "15", name: "Welikade", timeFromStart: "00.57" },
      { id: "16", name: "Piliyandala", timeFromStart: "01.01" },
      { id: "17", name: "Bandaragama Junction", timeFromStart: "01.04" },
      { id: "18", name: "Nagoda", timeFromStart: "01.07" },
      { id: "19", name: "Kahathuduwa", timeFromStart: "01.09" },
      { id: "20", name: "Kesbewa", timeFromStart: "01.10" },
    ],
  },
  {
    id: "RT-003", name: "Route 122", from: "Colombo Fort", to: "Avissawella",
    stops: 25, buses: 30, avgTime: "1 hr 30 min", status: "Active",
    stopList: [
      { id: "01", name: "Colombo Fort", timeFromStart: "00.00" },
      { id: "02", name: "Maradana", timeFromStart: "00.05" },
      { id: "03", name: "Borella", timeFromStart: "00.10" },
      { id: "04", name: "Rajagiriya", timeFromStart: "00.15" },
      { id: "05", name: "Kotte", timeFromStart: "00.20" },
      { id: "06", name: "Nugegoda", timeFromStart: "00.25" },
      { id: "07", name: "Maharagama", timeFromStart: "00.30" },
      { id: "08", name: "Homagama", timeFromStart: "00.38" },
      { id: "09", name: "Godagama", timeFromStart: "00.43" },
      { id: "10", name: "Kahathuduwa", timeFromStart: "00.48" },
      { id: "11", name: "Bandaragama", timeFromStart: "00.53" },
      { id: "12", name: "Hanwella Junction", timeFromStart: "00.58" },
      { id: "13", name: "Padukka", timeFromStart: "01.03" },
      { id: "14", name: "Awissawella Road", timeFromStart: "01.08" },
      { id: "15", name: "Ingiriya Junction", timeFromStart: "01.12" },
      { id: "16", name: "Labugama", timeFromStart: "01.15" },
      { id: "17", name: "Yatiyanthota Junction", timeFromStart: "01.18" },
      { id: "18", name: "Kitulgala Turn", timeFromStart: "01.21" },
      { id: "19", name: "Deraniyagala Road", timeFromStart: "01.23" },
      { id: "20", name: "Kithulgala", timeFromStart: "01.25" },
      { id: "21", name: "Ruwanwella", timeFromStart: "01.27" },
      { id: "22", name: "Mawanella Road", timeFromStart: "01.28" },
      { id: "23", name: "Deraniyagala", timeFromStart: "01.29" },
      { id: "24", name: "Avissawella Bus Stand", timeFromStart: "01.29" },
      { id: "25", name: "Avissawella", timeFromStart: "01.30" },
    ],
  },
];

const STATUS_STYLES: Record<RouteStatus, string> = {
  Active: "bg-[#61de9f] text-[#00796b]",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Breakdown: "bg-red-100 text-red-600",
};

const STATUS_OPTIONS: RouteStatus[] = ["Active", "Maintenance", "Breakdown"];

type FormData = Omit<Route, "id">;

const emptyForm = (): FormData => ({
  name: "",
  from: "",
  to: "",
  stops: 0,
  buses: 5,
  avgTime: "",
  status: "Active",
  stopList: [],
});

function timeToMinutes(time: string): number {
  const parts = time.split(".");
  const hours = parseInt(parts[0] || "0");
  const mins = parseInt(parts[1] || "0");
  return hours * 60 + mins;
}

function minutesToReadable(totalMins: number): string {
  if (totalMins <= 0) return "0 min";
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export default function AdminManageRoutes() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RouteStatus | "All Status">("All Status");

  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [formError, setFormError] = useState("");

  const [viewRoute, setViewRoute] = useState<Route | null>(null);

  const [showStopsModal, setShowStopsModal] = useState(false);
  const [draftStops, setDraftStops] = useState<Stop[]>([]);
  const [stopsError, setStopsError] = useState("");

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.status === "Active").length;
  const maintenanceRoutes = routes.filter((r) => r.status === "Maintenance").length;
  const breakdownRoutes = routes.filter((r) => r.status === "Breakdown").length;

  const filtered = routes.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openStopsModal = () => {
    const firstStop: Stop = { id: "01", name: form.from || "Start", timeFromStart: "00.00" };
    if (form.stopList.length > 0) {
      setDraftStops([...form.stopList]);
    } else {
      setDraftStops([firstStop, { id: "02", name: "", timeFromStart: "" }]);
    }
    setStopsError("");
    setShowStopsModal(true);
  };

  const addStopRow = (insertAfterIndex?: number) => {
    const newStop: Stop = { id: "", name: "", timeFromStart: "" };
    setDraftStops((prev) => {
      let updated: Stop[];
      if (insertAfterIndex !== undefined) {
        updated = [
          ...prev.slice(0, insertAfterIndex + 1),
          newStop,
          ...prev.slice(insertAfterIndex + 1),
        ];
      } else {
        updated = [...prev, newStop];
      }
      return updated.map((s, i) => ({ ...s, id: String(i + 1).padStart(2, "0") }));
    });
  };

  const updateStop = (index: number, field: keyof Stop, value: string) => {
    setDraftStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeStop = (index: number) => {
    setDraftStops((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, id: String(i + 1).padStart(2, "0") }))
    );
  };

  const confirmStops = () => {
    for (let i = 0; i < draftStops.length; i++) {
      const s = draftStops[i];
      if (!s.name.trim()) {
        setStopsError(`Stop ${i + 1} is missing a name.`);
        return;
      }
      if (!/[a-zA-Z]/.test(s.name.trim())) {
        setStopsError(`Stop ${i + 1} name must contain letters (e.g. "Colombo Fort"), not just numbers.`);
        return;
      }
      if (!/^\d{2}\.\d{2}$/.test(s.timeFromStart)) {
        setStopsError(`Stop ${i + 1} time must be in HH.MM format (e.g. 00.40).`);
        return;
      }
    }

    const stopCount = draftStops.length;
    const maxMins = Math.max(...draftStops.map((s) => timeToMinutes(s.timeFromStart)));
    const readable = minutesToReadable(maxMins);

    const numbered = draftStops.map((s, i) => ({
      ...s,
      id: String(i + 1).padStart(2, "0"),
    }));

    setForm((prev) => ({
      ...prev,
      stopList: numbered,
      stops: stopCount,
      avgTime: readable,
    }));

    setStopsError("");
    setShowStopsModal(false);
  };

  const handleSave = () => {
    // Route Name: required + must match "Route <number>" format
    const routeNamePattern = /^Route\s+\d+$/i;
    if (!form.name.trim()) {
      setFormError("Action required: Route Name is required.");
      return;
    }
    if (!routeNamePattern.test(form.name.trim())) {
      setFormError("Route Name must be in the format 'Route 138' (e.g. Route 138, Route 220).");
      return;
    }

    // From: required and must contain letters
    if (!form.from.trim()) {
      setFormError("Action required: 'From' location is required.");
      return;
    }
    if (!/[a-zA-Z]/.test(form.from.trim())) {
      setFormError("'From' location must contain letters (e.g. Colombo Fort), not just numbers.");
      return;
    }

    // To: required and must contain letters
    if (!form.to.trim()) {
      setFormError("Action required: 'To' location is required.");
      return;
    }
    if (!/[a-zA-Z]/.test(form.to.trim())) {
      setFormError("'To' location must contain letters (e.g. Maharagama), not just numbers.");
      return;
    }

    // No. of Buses: must be 0 or a positive integer (no decimals, no negatives)
    if (!Number.isInteger(form.buses) || form.buses < 0) {
      setFormError("No. of Buses must be 0 or a positive whole number (e.g. 0, 5, 18).");
      return;
    }

    // Stops: must have at least one stop added
    if (form.stopList.length === 0) {
      setFormError("Please add stops using the 'Add Stops' button.");
      return;
    }

    if (editingRoute) {
      setRoutes((prev) =>
        prev.map((r) => (r.id === editingRoute.id ? { ...form, id: editingRoute.id } : r))
      );
    } else {
      const lastNum = routes.reduce((max, r) => {
        const num = parseInt(r.id.replace("RT-", ""));
        return num > max ? num : max;
      }, 0);
      const newRoute: Route = {
        ...form,
        id: `RT-${String(lastNum + 1).padStart(3, "0")}`,
      };
      setRoutes((prev) => [...prev, newRoute]);
    }

    setShowModal(false);
    setFormError("");
    Swal.fire({ icon: "success", title: "Saved Successfully", timer: 1500, showConfirmButton: false });
  };

  const handleDelete = async (route: Route) => {
    const result = await Swal.fire({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px 0">
                <img src="/icons/delete.png" style="width:30px;height:30px;margin-bottom:5px" alt="delete" />
                <p style="color:#374151;font-size:13px;font-weight:700;margin:0">Remove ${route.id}?</p>
                <p style="color:#9ca3af;font-size:11px;margin:0">${route.name} · Permanent Deletion</p>
             </div>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove Route",
    });
    if (result.isConfirmed) {
      setRoutes((prev) => prev.filter((r) => r.id !== route.id));
    }
  };

  return (
    <div className="p-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/route.png" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-3xl font-extrabold text-black">{totalRoutes}</p>
            <p className="text-[#94a0ae] text-sm">Total Routes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/success.png" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-3xl font-extrabold text-[#00796b]">{activeRoutes}</p>
            <p className="text-[#94a0ae] text-sm">Active Routes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/maintenance.png" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-3xl font-extrabold text-yellow-500">{maintenanceRoutes}</p>
            <p className="text-[#94a0ae] text-sm">Under Maintenance</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/warning.png" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-3xl font-extrabold text-red-500">{breakdownRoutes}</p>
            <p className="text-[#94a0ae] text-sm">Breakdowns</p>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
          <img src="/icons/lens.png" className="w-5 h-5 opacity-50" />
          <input
            type="text"
            placeholder="Search route ID, name or destination..."
            className="flex-1 text-sm bg-transparent outline-none text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="All Status">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditingRoute(null);
            setForm(emptyForm());
            setFormError("");
            setShowModal(true);
          }}
          className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-md"
        >
          Add Route
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-9 bg-[#f5f8fc] px-4 py-3 text-sm font-extrabold text-gray-700 border-b uppercase tracking-wider">
          <div>Route ID</div>
          <div>Route Name</div>
          <div className="col-span-2">From → To</div>
          <div>Stops</div>
          <div>Buses</div>
          <div>Avg Time</div>
          <div>Status</div>
          <div className="text-center">Action</div>
        </div>

        {filtered.length > 0 ? (
          filtered.map((route) => (
            <div
              key={route.id}
              className="grid grid-cols-9 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
            >
              <div className="font-semibold text-[#122843]">{route.id}</div>
              <div className="font-medium text-gray-700">{route.name}</div>
              <div className="col-span-2 text-xs">
                <span className="font-semibold text-gray-700">{route.from}</span>
                <span className="mx-1 text-gray-400">→</span>
                <span className="font-semibold text-gray-700">{route.to}</span>
              </div>
              <div className="text-gray-600">{route.stops}</div>
              <div className="text-gray-600">{route.buses}</div>
              <div className="text-gray-600 text-xs">{route.avgTime}</div>
              <div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[route.status]}`}>
                  {route.status}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setViewRoute(route)}
                  className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition"
                >
                  <img src="/icons/view.png" className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setEditingRoute(route);
                    setForm({ ...route });
                    setFormError("");
                    setShowModal(true);
                  }}
                  className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition"
                >
                  <img src="/icons/edit.png" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(route)}
                  className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition"
                >
                  <img src="/icons/delete.png" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center text-gray-400 bg-white">
            <p className="text-sm font-medium">No routes found.</p>
          </div>
        )}
      </div>

      {/* ── ADD/EDIT MODAL ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg mx-4 relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-bold"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <img src="/icons/route.png" className="w-10 h-10 object-contain" />
              {editingRoute ? `Update ${editingRoute.id}` : "New Route Registration"}
            </h2>

            {formError && (
              <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Route Name</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="e.g. Route 138"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">No. of Buses</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  value={form.buses}
                  onChange={(e) => setForm({ ...form, buses: Math.floor(Number(e.target.value)) })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">From</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="e.g. Colombo Fort"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">To</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="e.g. Maharagama"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
              </div>

              {/* Auto-calculated read-only display */}
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                  No. of Stops <span className="text-[#4CAF8A] normal-case font-semibold">(auto-calculated)</span>
                </label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {form.stops > 0 ? `${form.stops} stops` : "—"}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                  Avg Travel Time <span className="text-[#4CAF8A] normal-case font-semibold">(auto-calculated)</span>
                </label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {form.avgTime || "—"}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Status</label>
                <select
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as RouteStatus })}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Stops button */}
            <button
              onClick={openStopsModal}
              className="mt-4 w-full h-11 border-2 border-dashed border-[#4CAF8A] rounded-xl text-[#4CAF8A] font-bold text-sm hover:bg-[#4CAF8A]/5 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">📍</span>
              {form.stopList.length > 0
                ? `Edit Stops  ·  ${form.stopList.length} stops added`
                : "Add Stops"}
            </button>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200"
                onClick={() => setShowModal(false)}
              >
                Discard
              </button>
              <button
                className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg"
                onClick={handleSave}
              >
                Save Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD STOPS SUB-MODAL ────────────────────────────────────── */}
      {showStopsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-xl mx-4 relative flex flex-col max-h-[85vh]">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-bold"
              onClick={() => setShowStopsModal(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-[#122843] mb-1 flex items-center gap-2">
              <span className="text-2xl">📍</span> Add Stops
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Enter each stop name and time from the start in{" "}
              <span className="font-bold text-gray-600">HH.MM</span> format
              (e.g. <span className="font-mono">00.40</span> = 40 min,{" "}
              <span className="font-mono">01.30</span> = 1 hr 30 min).
              Hover between stops to insert a new stop at that position.
            </p>

            {stopsError && (
              <div className="mb-3 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                ⚠️ {stopsError}
              </div>
            )}

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-1">
              <div className="col-span-1 text-[10px] uppercase font-black text-gray-400">No.</div>
              <div className="col-span-6 text-[10px] uppercase font-black text-gray-400">Stop Name</div>
              <div className="col-span-4 text-[10px] uppercase font-black text-gray-400">Time from Start</div>
              <div className="col-span-1"></div>
            </div>

            {/* Scrollable rows */}
            <div className="flex-1 overflow-y-auto pr-1">
              {draftStops.map((stop, index) => (
                <div key={index}>
                  {index > 0 && (
                    <div className="group flex items-center gap-2 my-0.5 px-1 h-6">
                      <div className="flex-1 h-px bg-gray-100 group-hover:bg-[#4CAF8A]/50 transition-colors duration-150" />
                      <button
                        onClick={() => addStopRow(index - 1)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-bold text-[#4CAF8A] border border-dashed border-[#4CAF8A] px-2 py-0.5 rounded-full hover:bg-[#4CAF8A]/10 whitespace-nowrap"
                      >
                        + Insert here
                      </button>
                      <div className="flex-1 h-px bg-gray-100 group-hover:bg-[#4CAF8A]/50 transition-colors duration-150" />
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-2 items-center py-1">
                    <div className="col-span-1 flex justify-center">
                      <span className="w-7 h-7 rounded-full bg-[#122843] text-white text-[11px] font-black flex items-center justify-center">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="col-span-6">
                      <input
                        className={`w-full h-9 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A] ${index === 0 ? "bg-gray-50 text-gray-400" : ""}`}
                        placeholder="e.g. Maharagama"
                        value={stop.name}
                        onChange={(e) => updateStop(index, "name", e.target.value)}
                        disabled={index === 0}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        className={`w-full h-9 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A] font-mono ${index === 0 ? "bg-gray-50 text-gray-400" : ""}`}
                        placeholder="00.00"
                        value={stop.timeFromStart}
                        onChange={(e) => updateStop(index, "timeFromStart", e.target.value)}
                        disabled={index === 0}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {index > 0 && (
                        <button
                          onClick={() => removeStop(index)}
                          className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 font-bold text-xs transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addStopRow()}
              className="mt-4 w-full h-9 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-bold text-sm hover:border-[#4CAF8A] hover:text-[#4CAF8A] transition flex items-center justify-center gap-1"
            >
              <span className="text-base leading-none">＋</span> Add Stop
            </button>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200"
                onClick={() => setShowStopsModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg"
                onClick={confirmStops}
              >
                Confirm Stops
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ─────────────────────────────────────────────── */}
      {viewRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-black"
              onClick={() => setViewRoute(null)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <img src="/icons/route.png" className="w-10 h-10 object-contain" />
              Route Info: {viewRoute.id}
            </h2>
            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Route Name</p>
                <p className="font-bold text-gray-800">{viewRoute.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Avg Travel Time</p>
                <p className="font-bold text-gray-800">{viewRoute.avgTime}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">From</p>
                <p className="font-bold text-gray-800">{viewRoute.from}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">To</p>
                <p className="font-bold text-gray-800">{viewRoute.to}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Total Stops</p>
                <p className="font-bold text-gray-800">{viewRoute.stops} Stops</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Assigned Buses</p>
                <p className="font-bold text-gray-800">{viewRoute.buses} Buses</p>
              </div>

              {viewRoute.stopList && viewRoute.stopList.length > 0 && (
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Stop Details</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {viewRoute.stopList.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#122843] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                          {s.id}
                        </span>
                        <span className="flex-1 text-gray-700 font-medium">{s.name}</span>
                        <span className="text-gray-400 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {s.timeFromStart}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="col-span-2 pt-4 border-t border-gray-200">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Route Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewRoute.status]}`}>
                  {viewRoute.status}
                </span>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setViewRoute(null)}
                className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl"
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
