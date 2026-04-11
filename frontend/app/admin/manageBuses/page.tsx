"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type BusStatus = "Active" | "Maintenance" | "Breakdown";
type BusType = "A/C Express" | "Semi-Luxury" | "Regular";

type Driver = {
  name: string;
  email: string;
  phone: string;
  nic: string;
};

type Bus = {
  id: number;
  busNo: string;
  plate: string;
  type: BusType;
  route: string;
  ownerNic: string;
  drivers: Driver[];
  seats: number;
  lastService: string;
  status: BusStatus;
  password: string;
};

const initialBuses: Bus[] = [
  {
    id: 1, busNo: "BUS0001", plate: "WP ND-5521", type: "A/C Express", route: "Route 12",
    ownerNic: "198812345678",
    drivers: [
      { name: "A.K.S. Perera", email: "aksperera@routeme.lk", phone: "0771234501", nic: "199012345670" },
    ],
    seats: 52, lastService: "2026-02-20", status: "Active", password: "Bus1@Route12",
  },
  {
    id: 2, busNo: "BUS0002", plate: "WP NC-8842", type: "Semi-Luxury", route: "Route 32",
    ownerNic: "197534567890",
    drivers: [
      { name: "S.M. Kavindu", email: "smkavindu@routeme.lk", phone: "0712345602", nic: "199234567891" },
      { name: "R.P. Bandara", email: "rpbandara@routeme.lk", phone: "0778890123", nic: "198834567892" },
    ],
    seats: 45, lastService: "2026-01-15", status: "Active", password: "Bus2#Lux32",
  },
  {
    id: 3, busNo: "BUS0003", plate: "CP NB-1234", type: "Regular", route: "Route 9",
    ownerNic: "198023456789",
    drivers: [
      { name: "U. Piyaratne", email: "upiyaratne@routeme.lk", phone: "0763456703", nic: "199523456780" },
    ],
    seats: 60, lastService: "2026-03-05", status: "Active", password: "Route9$Bus3",
  },
  {
    id: 4, busNo: "BUS0004", plate: "WP NC-2290", type: "A/C Express", route: "Route 11",
    ownerNic: "197845678901",
    drivers: [
      { name: "T.L.G. Saman", email: "tlgsaman@routeme.lk", phone: "0704567804", nic: "198845678902" },
    ],
    seats: 52, lastService: "2026-02-28", status: "Active", password: "Saman@2026!",
  },
];

const STATUS_STYLES: Record<BusStatus, string> = {
  Active: "bg-[#61de9f] text-[#00796b]",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Breakdown: "bg-red-100 text-red-600",
};

const BUS_TYPE_OPTIONS: BusType[] = ["A/C Express", "Semi-Luxury", "Regular"];
const STATUS_OPTIONS: BusStatus[] = ["Active", "Maintenance", "Breakdown"];

const emptyDriver = (): Driver => ({ name: "", email: "", phone: "", nic: "" });

const emptyForm = () => ({
  plate: "",
  type: "Regular" as BusType,
  route: "",
  ownerNic: "",
  drivers: [emptyDriver()],
  seats: 45,
  lastService: "",
  status: "Active" as BusStatus,
});

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const driverNameRegex = /^([A-Z]\.\s?)+[A-Z][a-z]+(\s[A-Z][a-z]+)*$/;
const routeRegex = /^Route \d+$/;
const plateRegex = /^[A-Z]{2}\s([A-Z]{2,3}-\d{4}|\d{2}-\d{4})$/i;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^07[0-9]{8}$/;
// Sri Lanka NIC: old format 9 digits + V/X, or new format 12 digits
const nicRegex = /^([0-9]{9}[VvXx]|[0-9]{12})$/;

export default function AdminManageBuses() {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BusStatus | "All Status">("All Status");
  const [showModal, setShowModal] = useState(false);
  const [viewBus, setViewBus] = useState<Bus | null>(null);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");

  const [passwordMode, setPasswordMode] = useState<"auto" | "custom">("auto");
  const [autoPassword, setAutoPassword] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);

  const totalFleet = buses.length;
  const inMaintenance = buses.filter((b) => b.status === "Maintenance").length;
  const breakdownCount = buses.filter((b) => b.status === "Breakdown").length;
  const operational = buses.filter((b) => b.status === "Active").length;

  const filtered = buses.filter((b) => {
    const matchSearch =
      b.busNo.toLowerCase().includes(search.toLowerCase()) ||
      b.plate.toLowerCase().includes(search.toLowerCase()) ||
      b.drivers.some((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All Status" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAddModal = () => {
    setEditingBus(null);
    setForm(emptyForm());
    setAutoPassword(generatePassword());
    setCustomPassword("");
    setPasswordMode("auto");
    setShowPassword(false);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (bus: Bus) => {
    setEditingBus(bus);
    setForm({
      plate: bus.plate,
      type: bus.type,
      route: bus.route,
      ownerNic: bus.ownerNic,
      drivers: bus.drivers.map((d) => ({ ...d })),
      seats: bus.seats,
      lastService: bus.lastService,
      status: bus.status,
    });
    setAutoPassword(bus.password || generatePassword());
    setCustomPassword(bus.password || "");
    setPasswordMode("auto");
    setShowPassword(false);
    setFormError("");
    setShowModal(true);
  };

  const updateDriver = (index: number, field: keyof Driver, value: string) => {
    const updated = [...form.drivers];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, drivers: updated });
  };

  const addDriver = () => {
    if (form.drivers.length < 3) {
      setForm({ ...form, drivers: [...form.drivers, emptyDriver()] });
    }
  };

  const removeDriver = (index: number) => {
    const updated = form.drivers.filter((_, i) => i !== index);
    setForm({ ...form, drivers: updated });
  };

  const handleSave = () => {
    if (!form.plate || !form.route || !form.lastService) {
      setFormError("Action required: Please fill in all required fields.");
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
    if (!form.ownerNic.trim()) {
      setFormError("Owner NIC is required.");
      return;
    }
    if (!nicRegex.test(form.ownerNic.trim())) {
      setFormError("Owner NIC: Enter a valid Sri Lankan NIC (e.g., 199012345678 or 901234567V).");
      return;
    }
    for (let i = 0; i < form.drivers.length; i++) {
      const d = form.drivers[i];
      if (!d.name || !d.email || !d.phone || !d.nic) {
        setFormError(`Driver ${i + 1}: All contact fields including NIC are required.`);
        return;
      }
      if (!driverNameRegex.test(d.name.trim())) {
        setFormError(`Driver ${i + 1}: Name must be like "A.K.S. Perera".`);
        return;
      }
      if (!emailRegex.test(d.email.trim())) {
        setFormError(`Driver ${i + 1}: Enter a valid email address.`);
        return;
      }
      if (!phoneRegex.test(d.phone.trim())) {
        setFormError(`Driver ${i + 1}: Phone must be 10 digits starting with 07.`);
        return;
      }
      if (!nicRegex.test(d.nic.trim())) {
        setFormError(`Driver ${i + 1}: Enter a valid Sri Lankan NIC (e.g., 199012345678 or 901234567V).`);
        return;
      }
    }
    if (passwordMode === "custom" && customPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    const finalPassword = passwordMode === "auto" ? autoPassword : customPassword;

    if (editingBus) {
      setBuses((prev) =>
        prev.map((b) =>
          b.id === editingBus.id
            ? { ...form, id: editingBus.id, busNo: editingBus.busNo, password: finalPassword }
            : b
        )
      );
    } else {
      const lastNum = buses.reduce((max, bus) => {
        const num = parseInt(bus.busNo.replace("BUS", ""));
        return num > max ? num : max;
      }, 0);
      const newBus: Bus = {
        ...form,
        id: Date.now(),
        busNo: `BUS${String(lastNum + 1).padStart(4, "0")}`,
        password: finalPassword,
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
          <img src="/icons/break.png" className="w-12 h-12 object-contain" />
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
            placeholder="Search bus ID, plate or driver..."
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
          onClick={openAddModal}
          className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-md"
        >
          + Add Bus
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-8 bg-[#f5f8fc] px-4 py-3 text-sm font-extrabold text-gray-700 border-b uppercase tracking-wider">
          <div>Bus ID</div>
          <div>Plate</div>
          <div>Type</div>
          <div>Route</div>
          <div>Seats</div>
          <div>Last Service</div>
          <div>Status</div>
          <div className="text-center">Action</div>
        </div>

        {filtered.length > 0 ? (
          filtered.map((bus) => (
            <div key={bus.id} className="grid grid-cols-8 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
              <div className="font-semibold text-[#122843]">{bus.busNo}</div>
              <div className="font-medium text-gray-600">{bus.plate}</div>
              <div>{bus.type}</div>
              <div>{bus.route}</div>
              <div>{bus.seats}</div>
              <div>{bus.lastService}</div>
              <div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[bus.status]}`}>
                  {bus.status}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { setShowViewPassword(false); setViewBus(bus); }}
                  className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition"
                >
                  <img src="/icons/view.png" className="w-6 h-6" />
                </button>
                <button
                  onClick={() => openEditModal(bus)}
                  className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition"
                >
                  <img src="/icons/edit.png" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(bus)}
                  className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition"
                >
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-bold"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <img src="/icons/fleet.png" className="w-10 h-10" />
              {editingBus ? `Update ${editingBus.busNo}` : "New Bus Registration"}
            </h2>

            {formError && (
              <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-5">
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

              {/* Owner NIC */}
              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Bus Owner NIC</label>
                <input
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="e.g. 199012345678 or 901234567V"
                  value={form.ownerNic}
                  onChange={(e) => setForm({ ...form, ownerNic: e.target.value })}
                />
              </div>
            </div>

            {/* Driver Contact Details */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                  Driver Contact Details
                  <span className="ml-2 text-gray-300 font-normal normal-case">({form.drivers.length}/3)</span>
                </label>
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
              <div className="space-y-3">
                {form.drivers.map((driver, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-black text-gray-400">Driver {index + 1}</span>
                      {form.drivers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDriver(index)}
                          className="text-xs text-red-400 hover:text-red-600 font-bold transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">Name</label>
                        <input
                          className="w-full h-9 border rounded-lg px-2.5 text-xs outline-none focus:border-[#4CAF8A] bg-white"
                          placeholder="A.K. Perera"
                          value={driver.name}
                          onChange={(e) => updateDriver(index, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">NIC</label>
                        <input
                          className="w-full h-9 border rounded-lg px-2.5 text-xs outline-none focus:border-[#4CAF8A] bg-white"
                          placeholder="199012345678 or 901234567V"
                          value={driver.nic}
                          onChange={(e) => updateDriver(index, "nic", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">Email</label>
                        <input
                          className="w-full h-9 border rounded-lg px-2.5 text-xs outline-none focus:border-[#4CAF8A] bg-white"
                          placeholder="email@routeme.lk"
                          value={driver.email}
                          onChange={(e) => updateDriver(index, "email", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-black text-gray-400 mb-1">Phone</label>
                        <input
                          className="w-full h-9 border rounded-lg px-2.5 text-xs outline-none focus:border-[#4CAF8A] bg-white"
                          placeholder="07xxxxxxxx"
                          maxLength={10}
                          value={driver.phone}
                          onChange={(e) => updateDriver(index, "phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-wider">Bus Access Password</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPasswordMode("auto")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                    passwordMode === "auto"
                      ? "bg-[#122843] text-white border-[#122843]"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  ✨ Auto-Generate
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordMode("custom")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                    passwordMode === "custom"
                      ? "bg-[#122843] text-white border-[#122843]"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  ✏️ Custom Password
                </button>
              </div>
              {passwordMode === "auto" ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-10 border border-dashed border-[#4CAF8A] rounded-lg px-3 flex items-center justify-between bg-green-50">
                    <span className="text-sm font-mono text-[#122843] font-bold tracking-wider">
                      {showPassword ? autoPassword : "•".repeat(autoPassword.length)}
                    </span>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 text-xs ml-2">
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
                    className="w-full h-10 border rounded-lg px-3 pr-10 text-sm focus:border-[#4CAF8A] outline-none"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">
                {passwordMode === "auto"
                  ? "A secure password has been generated. Share it with the assigned drivers."
                  : "Enter a strong password with at least 8 characters."}
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200" onClick={() => setShowModal(false)}>
                Discard
              </button>
              <button className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg" onClick={handleSave}>
                Save Bus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative max-h-[90vh] overflow-y-auto">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-black" onClick={() => setViewBus(null)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <img src="/icons/fleet.png" className="w-10 h-10" />
              Bus Info: {viewBus.busNo}
            </h2>
            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100 mb-4">
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Bus ID</p><p className="font-bold text-gray-800">{viewBus.busNo}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Plate Number</p><p className="font-bold text-gray-800">{viewBus.plate}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Service Type</p><p className="font-bold text-gray-800">{viewBus.type}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Active Route</p><p className="font-bold text-gray-800">{viewBus.route}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Seating Capacity</p><p className="font-bold text-gray-800">{viewBus.seats} Seats</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Last Maintenance</p><p className="font-bold text-gray-800">{viewBus.lastService}</p></div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Bus Owner NIC</p>
                <p className="font-bold text-gray-800">{viewBus.ownerNic}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Fleet Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewBus.status]}`}>
                  {viewBus.status}
                </span>
              </div>
              <div className="col-span-2 pt-4 border-t border-gray-200">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Bus Access Password</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-gray-800 tracking-wider">
                    {showViewPassword ? viewBus.password : "•".repeat(viewBus.password?.length || 8)}
                  </p>
                  <button type="button" onClick={() => setShowViewPassword(!showViewPassword)} className="text-gray-400 hover:text-gray-600 text-sm">
                    {showViewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-3">Assigned Drivers ({viewBus.drivers.length})</p>
              <div className="space-y-3">
                {viewBus.drivers.map((driver, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-2">Driver {index + 1}</p>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div><p className="text-[9px] uppercase text-gray-400 mb-0.5">Name</p><p className="font-bold text-gray-800 text-sm">{driver.name}</p></div>
                      <div><p className="text-[9px] uppercase text-gray-400 mb-0.5">NIC</p><p className="font-bold text-gray-800 text-sm">{driver.nic}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[9px] uppercase text-gray-400 mb-0.5">Email</p><p className="font-semibold text-gray-700 text-xs break-all">{driver.email}</p></div>
                      <div><p className="text-[9px] uppercase text-gray-400 mb-0.5">Phone</p><p className="font-bold text-gray-800 text-sm">{driver.phone}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewBus(null)} className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
