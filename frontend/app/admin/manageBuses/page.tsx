"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type BusStatus = "Active" | "Maintenance" | "Breakdown";
type BusType = "A/C Express" | "Semi-Luxury" | "Regular";

type Bus = {
  id: number;
  busNo: string; 
  plate: string;
  type: BusType;
  route: string;
  driver: string;
  seats: number;
  lastService: string;
  status: BusStatus;
};

const initialBuses: Bus[] = [
  { id: 1, busNo: "Bus 1", plate: "WP ND-5521", type: "A/C Express", route: "Route 12", driver: "A.K.SPerera", seats: 52, lastService: "2026-02-20", status: "Active" },
  { id: 2, busNo: "Bus 2", plate: "WP NC-8842", type: "Semi-Luxury", route: "Route 32", driver: "S.M.Kavindu", seats: 45, lastService: "2026-01-15", status: "Active" },
  { id: 3, busNo: "Bus 3", plate: "CP NB-1234", type: "Regular", route: "Route 9", driver: "U.Piyaratne", seats: 60, lastService: "2026-03-05", status: "Active" },
  { id: 4, busNo: "Bus 4", plate: "WP NC-2290", type: "A/C Express", route: "Route 11", driver: "T.l.G.Saman", seats: 52, lastService: "2026-02-28", status: "Active" },
  { id: 5, busNo: "Bus 5", plate: "SP 62-4667", type: "Regular", route: "Route 37", driver: "W.S.Fernando", seats: 60, lastService: "2026-02-10", status: "Maintenance" },
  { id: 6, busNo: "Bus 6", plate: "WP NC-2399", type: "Semi-Luxury", route: "Route 42", driver: "M.P.K.L.Anusha", seats: 45, lastService: "2026-03-03", status: "Active" },
  { id: 7, busNo: "Bus 7", plate: "NW 61-7941", type: "A/C Express", route: "Route 14", driver: "A.Mohomad", seats: 52, lastService: "2026-02-14", status: "Breakdown" },
];

const STATUS_STYLES: Record<BusStatus, string> = {
  Active: "bg-[#61de9f] text-[#00796b]",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Breakdown: "bg-red-100 text-red-600",
};

const BUS_TYPE_OPTIONS: BusType[] = ["A/C Express", "Semi-Luxury", "Regular"];
const STATUS_OPTIONS: BusStatus[] = ["Active", "Maintenance", "Breakdown"];

const emptyForm = (): Omit<Bus, "id" | "busNo"> => ({
  plate: "", type: "Regular", route: "", driver: "", seats: 45, lastService: "", status: "Active",
});

const driverNameRegex = /^([A-Z]\.)+[A-Za-z]+$/;
const routeRegex = /^Route \d+$/;
const plateRegex = /^[A-Z]{2}\s([A-Z]{2,3}-\d{4}|\d{2}-\d{4})$/i;

export default function AdminManageBuses() {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusStatus | "All Status">("All Status");
  const [showModal, setShowModal] = useState(false);
  const [viewBus, setViewBus] = useState<Bus | null>(null);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [form, setForm] = useState<Omit<Bus, "id" | "busNo">>(emptyForm());
  const [formError, setFormError] = useState("");

  const totalFleet = buses.length;
  const inMaintenance = buses.filter((b) => b.status === "Maintenance").length;
  const breakdownCount = buses.filter((b) => b.status === "Breakdown").length;
  const operational = buses.filter((b) => b.status === "Active").length;

  const filtered = buses.filter((b) => {
    const matchSearch =
      b.busNo.toLowerCase().includes(search.toLowerCase()) ||
      b.plate.toLowerCase().includes(search.toLowerCase()) ||
      b.driver.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = () => {
    if (!form.plate || !form.route || !form.driver || !form.lastService) {
      setFormError("Action required: Please fill in all fields.");
      return;
    }
    if (!plateRegex.test(form.plate.trim())) {
      setFormError('Format Error: Use Sri Lankan format (e.g., "WP NC-1234").');
      return;
    }
    if (!routeRegex.test(form.route.trim())) {
      setFormError('Format Error: Route must be like "Route 9".');
      return;
    }
    if (!driverNameRegex.test(form.driver.trim())) {
      setFormError('Format Error: Driver name must be like "A.Perera".');
      return;
    }

    if (editingBus) {
      setBuses((prev) => prev.map((b) => (b.id === editingBus.id ? { ...form, id: editingBus.id, busNo: editingBus.busNo } : b)));
    } else {
      const lastBusNum = buses.reduce((max, bus) => {
        const num = parseInt(bus.busNo.replace("Bus ", ""));
        return num > max ? num : max;
      }, 0);
      
      const newBus: Bus = {
        ...form,
        id: Date.now(),
        busNo: `Bus ${lastBusNum + 1}`
      };
      setBuses((prev) => [...prev, newBus]);
    }

    setShowModal(false);
    setFormError("");
    Swal.fire({ icon: "success", title: "Saved Successfully", timer: 1500, showConfirmButton: false });
  };

  const handleDelete = async (bus: Bus) => {
    const result = await Swal.fire({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px 0">
                <img src="/icons/delete.png" style="width:30px;height:30px;margin-bottom:5px" alt="delete" />
                <p style="color:#374151;font-size:13px;font-weight:700;margin:0">Remove ${bus.busNo}?</p>
                <p style="color:#9ca3af;font-size:11px;margin:0">${bus.plate} · Permanent Deletion</p>
             </div>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove Bus",
    });
    if (result.isConfirmed) {
      setBuses((prev) => prev.filter((b) => b.id !== bus.id));
    }
  };

  return (
    <div className="p-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/fleet.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-black">{totalFleet}</p><p className="text-[#94a0ae] text-sm">Total Fleet</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/maintenance.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-yellow-500">{inMaintenance}</p><p className="text-[#94a0ae] text-sm">In Maintenance</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/warning.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-red-500">{breakdownCount}</p><p className="text-[#94a0ae] text-sm">Breakdowns</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/success.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-[#00796b]">{operational}</p><p className="text-[#94a0ae] text-sm">Operational</p></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
          <img src="/icons/lens.png" className="w-5 h-5 opacity-50" />
          <input
            type="text"
            placeholder="Search bus, plate or driver..."
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
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => { setEditingBus(null); setForm(emptyForm()); setFormError(""); setShowModal(true); }}
          className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-md"
        >
          Add Bus
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-9 bg-[#f5f8fc] px-4 py-3 text-sm font-extrabold text-gray-700 border-b uppercase tracking-wider">
          <div>Bus No.</div><div>Plate</div><div>Type</div><div>Route</div><div>Driver</div>
          <div>Seats</div><div>Last Service</div><div>Status</div><div className="text-center">Action</div>
        </div>

        {filtered.length > 0 ? (
          filtered.map((bus) => (
            <div key={bus.id} className="grid grid-cols-9 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
              <div className="font-semibold">{bus.busNo}</div>
              <div className="font-medium text-gray-600">{bus.plate}</div>
              <div>{bus.type}</div>
              <div>{bus.route}</div>
              <div>{bus.driver}</div>
              <div>{bus.seats}</div>
              <div>{bus.lastService}</div>
              <div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[bus.status]}`}>
                  {bus.status}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setViewBus(bus)} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition">
                  <img src="/icons/view.png" className="w-6 h-6" />
                </button>
                <button onClick={() => { setEditingBus(bus); setForm(bus); setShowModal(true); }} className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition">
                  <img src="/icons/edit.png" className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(bus)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition">
                  <img src="/icons/delete.png" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center text-gray-400 bg-white">
            <p className="text-sm font-medium">No buses found.</p>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg mx-4 relative">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-bold" onClick={() => setShowModal(false)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <img src="/icons/fleet.png" className="w-10 h-10" />
              {editingBus ? `Update ${editingBus.busNo}` : "New Bus Registration"}
            </h2>

            {formError && (
              <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">License Plate (SL Format)</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="e.g. WP NC-1234"
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Driver Name</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="A.Perera"
                  value={form.driver}
                  onChange={(e) => setForm({ ...form, driver: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Active Route</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="Route 05"
                  value={form.route}
                  onChange={(e) => setForm({ ...form, route: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Seating</label>
                <input
                  type="number"
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Last Service Date</label>
                <input
                  type="date"
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  value={form.lastService}
                  onChange={(e) => setForm({ ...form, lastService: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Category</label>
                <select
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as BusType })}
                >
                  {BUS_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Status</label>
                <select
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BusStatus })}
                >
                  {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200" onClick={() => setShowModal(false)}>Discard</button>
              <button className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg" onClick={handleSave}>Save Bus</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-black" onClick={() => setViewBus(null)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <img src="/icons/fleet.png" className="w-10 h-10" />
              Bus Info: {viewBus.busNo}
            </h2>
            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Plate Number</p><p className="font-bold text-gray-800">{viewBus.plate}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Service Type</p><p className="font-bold text-gray-800">{viewBus.type}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Assigned Driver</p><p className="font-bold text-gray-800">{viewBus.driver}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Active Route</p><p className="font-bold text-gray-800">{viewBus.route}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Seating Capacity</p><p className="font-bold text-gray-800">{viewBus.seats} Seats</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Last Maintenance</p><p className="font-bold text-gray-800">{viewBus.lastService}</p></div>
              <div className="col-span-2 pt-4 border-t border-gray-200">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Fleet Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewBus.status]}`}>
                  {viewBus.status}
                </span>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewBus(null)} className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}