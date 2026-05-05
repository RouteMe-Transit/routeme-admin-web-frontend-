"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type BusStatus = "Active" | "Maintenance" | "Breakdown";
type BusType   = "A/C Express" | "Semi-Luxury" | "Regular";

type Owner = {
  name:  string;
  nic:   string;
  email: string;
  phone: string;
};

type Driver = {
  name:  string;
  nic:   string;
  email: string;
  phone: string;
};

type Driver = {
  name: string;
  email: string;
  phone: string;
  nic: string;
};

type Bus = {
  id:          number;
  busId:       string;
  plate:       string;
  type:        BusType;
  route:       string;
  owner:       Owner;
  drivers:     Driver[];
  seats:       number;
  lastService: string;
  status:      BusStatus;
  password:    string;
};

/* ─── Seed data ─────────────────────────────────────────────────────────── */
const initialBuses: Bus[] = [
  {
    id: 1, busId: "BUS0001", plate: "WP ND-5521", type: "A/C Express", route: "Route 12",
    owner: { name: "Chaminda Perera", nic: "000000001V", email: "owner1@routeme.lk", phone: "0700000001" }, // DUMMY
    drivers: [
      { name: "Darshana Perera", nic: "000000002V", email: "driver1@routeme.lk", phone: "0700000002" }, // DUMMY
    ],
    seats: 52, lastService: "2026-02-20", status: "Active", password: "PLACEHOLDER_PASSWORD",
  },
  {
    id: 2, busId: "BUS0002", plate: "WP NC-8842", type: "Semi-Luxury", route: "Route 32",
    owner: { name: "Nimal Dissanayake", nic: "000000003V", email: "owner2@routeme.lk", phone: "0700000003" }, // DUMMY
    drivers: [
      { name: "Ravindu Dissanayake", nic: "000000004V", email: "driver2@routeme.lk", phone: "0700000004" }, // DUMMY
      { name: "Malith Hettiarachchi", nic: "000000005V", email: "driver3@routeme.lk", phone: "0700000005" }, // DUMMY
    ],
    seats: 45, lastService: "2026-01-15", status: "Active", password: "PLACEHOLDER_PASSWORD",
  },
  {
    id: 3, busId: "BUS0003", plate: "CP NB-1234", type: "Regular", route: "Route 9",
    owner: { name: "Sunil Piyarathne", nic: "000000006V", email: "owner3@routeme.lk", phone: "0700000006" }, // DUMMY
    drivers: [
      { name: "Udana Piyarathne", nic: "000000007V", email: "driver4@routeme.lk", phone: "0700000007" }, // DUMMY
    ],
    seats: 60, lastService: "2026-03-05", status: "Active", password: "PLACEHOLDER_PASSWORD",
  },
  {
    id: 4, busId: "BUS0004", plate: "WP NC-2290", type: "A/C Express", route: "Route 11",
    owner: { name: "Roshan Karunarathne", nic: "000000008V", email: "owner4@routeme.lk", phone: "0700000008" }, // DUMMY
    drivers: [
      { name: "Gayan Karunarathne", nic: "000000009V", email: "driver5@routeme.lk", phone: "0700000009" }, // DUMMY
    ],
    seats: 52, lastService: "2026-02-28", status: "Active", password: "PLACEHOLDER_PASSWORD",
  },
];

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<BusStatus, string> = {
  Active:      "bg-[#61de9f] text-[#00796b]",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Breakdown:   "bg-red-100 text-red-600",
};

const BUS_TYPE_OPTIONS: BusType[]   = ["A/C Express", "Semi-Luxury", "Regular"];
const STATUS_OPTIONS:   BusStatus[] = ["Active", "Maintenance", "Breakdown"];

const emptyOwner  = (): Owner  => ({ name: "", nic: "", email: "", phone: "" });
const emptyDriver = (): Driver => ({ name: "", nic: "", email: "", phone: "" });

const emptyForm = () => ({
  plate:       "",
  type:        "Regular" as BusType,
  route:       "",
  owner:       emptyOwner(),
  drivers:     [emptyDriver()],
  seats:       45,
  lastService: "",
  status:      "Active" as BusStatus,
});

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateBusId(buses: Bus[]): string {
  const maxNum = buses.reduce((max, b) => {
    const n = parseInt(b.busId.replace("BUS", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `BUS${String(maxNum + 1).padStart(4, "0")}`;
}

/* ─── Validation ────────────────────────────────────────────────────────── */
const nameRegex  = /^[A-Z][a-z]+(\s[A-Z][a-z]+){1,3}$/;
const routeRegex = /^Route \d+$/;
const plateRegex = /^[A-Z]{2}\s([A-Z]{2,3}-\d{4}|\d{2}-\d{4})$/i;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^07[0-9]{8}$/;
const nicRegex   = /^([0-9]{9}[VXvx]|[0-9]{12})$/;

/* ─── Shared placeholder strings (unified with Add Admin modal) ─────────── */
const NIC_PLACEHOLDER   = "e.g. 199012345678 or 901234567V";
const EMAIL_PLACEHOLDER = "email@routeme.lk";

/* ─── Shared input / label classes ──────────────────────────────────────── */
const inputCls   = "w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]";
const labelCls   = "block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-wider";
const smInputCls = "w-full h-9 border rounded-lg px-2.5 text-xs outline-none focus:border-[#4CAF8A] bg-white";
const smLabelCls = "block text-[9px] uppercase font-black text-gray-400 mb-1";

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminManageBuses() {
  const [buses,        setBuses]        = useState<Bus[]>(initialBuses);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<BusStatus | "All Status">("All Status");
  const [showModal,    setShowModal]    = useState(false);
  const [viewBus,      setViewBus]      = useState<Bus | null>(null);
  const [editingBus,   setEditingBus]   = useState<Bus | null>(null);
  const [form,         setForm]         = useState(emptyForm());
  const [formError,    setFormError]    = useState("");

  const [passwordMode,     setPasswordMode]     = useState<"auto" | "custom">("auto");
  const [autoPassword,     setAutoPassword]     = useState("");
  const [customPassword,   setCustomPassword]   = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);

  /* ── Stats ── */
  const totalFleet     = buses.length;
  const inMaintenance  = buses.filter((b) => b.status === "Maintenance").length;
  const breakdownCount = buses.filter((b) => b.status === "Breakdown").length;
  const operational    = buses.filter((b) => b.status === "Active").length;

  /* ── Filter ── */
  const filtered = buses.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      b.busId.toLowerCase().includes(q) ||
      b.plate.toLowerCase().includes(q) ||
      b.owner.name.toLowerCase().includes(q) ||
      b.drivers.some((d) => d.name.toLowerCase().includes(q));
    const matchStatus = statusFilter === "All Status" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Modal helpers ── */
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
      plate:       bus.plate,
      type:        bus.type,
      route:       bus.route,
      owner:       { ...bus.owner },
      drivers:     bus.drivers.map((d) => ({ ...d })),
      seats:       bus.seats,
      lastService: bus.lastService,
      status:      bus.status,
    });
    setAutoPassword(bus.password || generatePassword());
    setCustomPassword(bus.password || "");
    setPasswordMode("auto");
    setShowPassword(false);
    setFormError("");
    setShowModal(true);
  };

  /* ── Owner field updater ── */
  const updateOwner = (field: keyof Owner, value: string) =>
    setForm({ ...form, owner: { ...form.owner, [field]: value } });

  /* ── Driver helpers ── */
  const updateDriver = (i: number, field: keyof Driver, value: string) => {
    const updated = [...form.drivers];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, drivers: updated });
  };
  const addDriver = () => {
    if (form.drivers.length < 3)
      setForm({ ...form, drivers: [...form.drivers, emptyDriver()] });
  };
  const removeDriver = (i: number) =>
    setForm({ ...form, drivers: form.drivers.filter((_, idx) => idx !== i) });

  /* ── Save ── */
  const handleSave = () => {
    if (!form.plate || !form.route || !form.lastService) {
      setFormError("Action required: Please fill in all required bus fields.");
      return;
    }
    if (!plateRegex.test(form.plate.trim())) {
      setFormError('Format Error: Plate must be like "WP NC-1234".');
      return;
    }
    if (!routeRegex.test(form.route.trim())) {
      setFormError('Format Error: Route must be like "Route 9".');
      return;
    }

    // Owner validation
    const o = form.owner;
    if (!o.name || !o.nic || !o.email || !o.phone) {
      setFormError("Owner: All contact fields are required.");
      return;
    }
    if (!nameRegex.test(o.name.trim())) {
      setFormError('Owner: Name must be like "Kavindra Senarathne".');
      return;
    }
    if (!nicRegex.test(o.nic.trim())) {
      setFormError("Owner: NIC must be 9 digits + V/X (old) or 12 digits (new).");
      return;
    }
    if (!emailRegex.test(o.email.trim())) {
      setFormError("Owner: Enter a valid email address.");
      return;
    }
    if (!phoneRegex.test(o.phone.trim())) {
      setFormError("Owner: Phone must be 10 digits starting with 07.");
      return;
    }

    // Driver validation
    for (let i = 0; i < form.drivers.length; i++) {
      const d = form.drivers[i];
      if (!d.name || !d.nic || !d.email || !d.phone) {
        setFormError(`Driver ${i + 1}: All contact fields are required.`);
        return;
      }
      if (!nameRegex.test(d.name.trim())) {
        setFormError(`Driver ${i + 1}: Name must be like "Kavindra Senarathne".`);
        return;
      }
      if (!nicRegex.test(d.nic.trim())) {
        setFormError(`Driver ${i + 1}: NIC must be 9 digits + V/X (old) or 12 digits (new).`);
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
            ? { ...form, id: editingBus.id, busId: editingBus.busId, password: finalPassword }
            : b
        )
      );
    } else {
      setBuses((prev) => [
        ...prev,
        { ...form, id: Date.now(), busId: generateBusId(buses), password: finalPassword },
      ]);
    }

    setShowModal(false);
    setFormError("");
    Swal.fire({ icon: "success", title: "Saved Successfully", timer: 1500, showConfirmButton: false });
  };

  /* ── Delete ── */
  const handleDelete = async (bus: Bus) => {
    const result = await Swal.fire({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px 0">
               <img src="/icons/delete.png" style="width:30px;height:30px;margin-bottom:5px" alt="delete" />
               <p style="color:#374151;font-size:13px;font-weight:700;margin:0">Remove ${bus.busId}?</p>
               <p style="color:#9ca3af;font-size:11px;margin:0">${bus.plate} · Permanent Deletion</p>
             </div>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove Bus",
    });
    if (result.isConfirmed)
      setBuses((prev) => prev.filter((b) => b.id !== bus.id));
  };

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-6">

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "/icons/fleet.png",       value: totalFleet,     label: "Total Fleet",    color: "text-black"      },
          { icon: "/icons/maintenance.png", value: inMaintenance,  label: "In Maintenance", color: "text-yellow-500" },
          { icon: "/icons/break.png",       value: breakdownCount, label: "Breakdowns",     color: "text-red-500"    },
          { icon: "/icons/success.png",     value: operational,    label: "Operational",    color: "text-[#00796b]"  },
        ].map(({ icon, value, label, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
            <img src={icon} className="w-12 h-12 object-contain" alt={label} />
            <div>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <p className="text-[#94a0ae] text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-72 shadow-sm">
          <img src="/icons/lens.png" className="w-5 h-5 opacity-50" alt="" />
          <input
            type="text"
            placeholder="Search bus ID, plate or driver..."
            className="flex-1 text-sm bg-transparent outline-none text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black shadow-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BusStatus | "All Status")}
        >
          <option value="All Status">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={openAddModal}
          className="ml-auto h-10 bg-[#e8b84b] text-white font-semibold px-6 rounded-lg hover:bg-[#d4a53e] transition shadow-sm"
        >
          + Add Bus
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-8 bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-600 border-b uppercase tracking-wide">
          <div>Bus ID</div><div>Plate</div><div>Type</div><div>Route</div>
          <div>Seats</div><div>Last Service</div><div>Status</div>
          <div className="text-center">Action</div>
        </div>

        {filtered.length > 0 ? filtered.map((bus) => (
          <div key={bus.id} className="grid grid-cols-8 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
            <div className="font-semibold">{bus.busId}</div>
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
            <div className="flex items-center justify-center gap-1.5">
              <button onClick={() => { setShowViewPassword(false); setViewBus(bus); }}
                className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition">
                <img src="/icons/view.png" className="w-5 h-5" alt="view" />
              </button>
              <button onClick={() => openEditModal(bus)}
                className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 transition">
                <img src="/icons/edit.png" className="w-4 h-4" alt="edit" />
              </button>
              <button onClick={() => handleDelete(bus)}
                className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition">
                <img src="/icons/delete.png" className="w-4 h-4" alt="delete" />
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 text-gray-400 text-sm">No buses found.</div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">

            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500"
              onClick={() => setShowModal(false)}>✕</button>

            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <img src="/icons/fleet.png" className="w-10 h-10" alt="" />
              {editingBus ? `Update ${editingBus.busId}` : "New Bus Registration"}
            </h2>

            {formError && (
              <div className="mb-4 text-[10px] font-black text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-widest">
                ⚠️ {formError}
              </div>
            )}

            {/* ── Bus Details ── */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2">
                <label className={labelCls}>License Plate (SL Format)</label>
                <input className={inputCls} placeholder="e.g. WP NC-1234"
                  value={form.plate ?? ""}
                  onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className={labelCls}>Active Route</label>
                <input className={inputCls} placeholder="Route 05"
                  value={form.route ?? ""}
                  onChange={(e) => setForm({ ...form, route: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Seating</label>
                <input type="number" className={inputCls}
                  value={form.seats ?? 0}
                  onChange={(e) => {
                    const p = parseInt(e.target.value, 10);
                    setForm({ ...form, seats: isNaN(p) ? 0 : p });
                  }} />
              </div>
              <div>
                <label className={labelCls}>Last Service Date</label>
                <input type="date" className={inputCls}
                  value={form.lastService ?? ""}
                  onChange={(e) => setForm({ ...form, lastService: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as BusType })}>
                  {BUS_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BusStatus })}>
                  {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
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

            {/* ── Bus Owner Contact ── */}
            <div className="mb-6">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-3">
                Bus Owner Contact
              </p>
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={smLabelCls}>Full Name</label>
                    <input className={smInputCls} placeholder="Kavindra Senarathne"
                      value={form.owner.name ?? ""}
                      onChange={(e) => updateOwner("name", e.target.value)} />
                  </div>
                  <div>
                    <label className={smLabelCls}>NIC</label>
                    {/* ↓ unified with Add Admin NIC placeholder */}
                    <input className={smInputCls} placeholder={NIC_PLACEHOLDER}
                      maxLength={12}
                      value={form.owner.nic ?? ""}
                      onChange={(e) => updateOwner("nic", e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className={smLabelCls}>Email</label>
                    {/* ↓ routeme.lk domain */}
                    <input className={smInputCls} placeholder={EMAIL_PLACEHOLDER}
                      value={form.owner.email ?? ""}
                      onChange={(e) => updateOwner("email", e.target.value)} />
                  </div>
                  <div>
                    <label className={smLabelCls}>Phone</label>
                    <input className={smInputCls} placeholder="07xxxxxxxx"
                      maxLength={10}
                      value={form.owner.phone ?? ""}
                      onChange={(e) => updateOwner("phone", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Driver Contact Details ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                  Driver Contact Details
                  <span className="ml-2 text-gray-300 font-normal normal-case">({form.drivers.length}/3)</span>
                </p>
                {form.drivers.length < 3 && (
                  <button type="button" onClick={addDriver}
                    className="text-xs font-bold text-[#4CAF8A] hover:text-[#3d9e7a] flex items-center gap-1 transition">
                    + Add Driver
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {form.drivers.map((driver, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-black text-gray-400">Driver {idx + 1}</span>
                      {form.drivers.length > 1 && (
                        <button type="button" onClick={() => removeDriver(idx)}
                          className="text-xs text-red-400 hover:text-red-600 font-bold transition">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className={smLabelCls}>Name</label>
                        <input className={smInputCls} placeholder="Kavindra Senarathne"
                          value={driver.name ?? ""}
                          onChange={(e) => updateDriver(idx, "name", e.target.value)} />
                      </div>
                      <div>
                        <label className={smLabelCls}>NIC</label>
                        {/* ↓ unified with Add Admin NIC placeholder */}
                        <input className={smInputCls} placeholder={NIC_PLACEHOLDER}
                          maxLength={12}
                          value={driver.nic ?? ""}
                          onChange={(e) => updateDriver(idx, "nic", e.target.value.toUpperCase())} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={smLabelCls}>Email</label>
                        {/* ↓ routeme.lk domain */}
                        <input className={smInputCls} placeholder={EMAIL_PLACEHOLDER}
                          value={driver.email ?? ""}
                          onChange={(e) => updateDriver(idx, "email", e.target.value)} />
                      </div>
                      <div>
                        <label className={smLabelCls}>Phone</label>
                        <input className={smInputCls} placeholder="07xxxxxxxx" maxLength={10}
                          value={driver.phone ?? ""}
                          onChange={(e) => updateDriver(idx, "phone", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Password ── */}
            <div className="mb-2">
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-wider">
                Bus Access Password
              </label>
              <div className="flex gap-2 mb-3">
                {(["auto", "custom"] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setPasswordMode(mode)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                      passwordMode === mode
                        ? "bg-[#122843] text-white border-[#122843]"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}>
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 text-xs ml-2">
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <button type="button" onClick={() => setAutoPassword(generatePassword())}
                    className="h-10 px-3 rounded-lg bg-[#4CAF8A] text-white text-xs font-bold hover:bg-[#3d9e7a] transition"
                    title="Regenerate">🔄</button>
                </div>
              ) : (
                <div className="relative">
                  <input type={showPassword ? "text" : "password"}
                    className="w-full h-10 border rounded-lg px-3 pr-10 text-sm focus:border-[#4CAF8A] outline-none"
                    value={customPassword ?? ""}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
              <button className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200"
                onClick={() => setShowModal(false)}>Discard</button>
              <button className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg"
                onClick={handleSave}>Save Bus</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {viewBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative max-h-[90vh] overflow-y-auto">

            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-black"
              onClick={() => setViewBus(null)}>✕</button>

            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <img src="/icons/fleet.png" className="w-10 h-10" alt="" />
              Bus Info: {viewBus.busId}
            </h2>

            {/* Core bus info */}
            <div className="grid grid-cols-2 gap-5 bg-gray-50/50 p-5 rounded-xl border border-gray-100 mb-4">
              {[
                ["Bus ID",           viewBus.busId],
                ["Plate Number",     viewBus.plate],
                ["Service Type",     viewBus.type],
                ["Active Route",     viewBus.route],
                ["Seating Capacity", `${viewBus.seats} Seats`],
                ["Last Maintenance", viewBus.lastService],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1">{label}</p>
                  <p className="font-bold text-gray-800">{val}</p>
                </div>
              ))}
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Fleet Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewBus.status]}`}>
                  {viewBus.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Access Password</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-gray-800 tracking-wider text-sm">
                    {showViewPassword ? viewBus.password : "•".repeat(viewBus.password?.length || 8)}
                  </p>
                  <button type="button" onClick={() => setShowViewPassword(!showViewPassword)}
                    className="text-gray-400 hover:text-gray-600 text-sm">
                    {showViewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            {/* Owner contact */}
            <div className="mb-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-wider">
                Bus Owner Contact
              </p>
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 grid grid-cols-2 gap-4">
                {[
                  ["Name",  viewBus.owner.name],
                  ["NIC",   viewBus.owner.nic],
                  ["Email", viewBus.owner.email],
                  ["Phone", viewBus.owner.phone],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[9px] uppercase text-gray-400 mb-0.5">{label}</p>
                    <p className="font-bold text-gray-800 text-sm break-all">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drivers */}
            <div className="mb-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-wider">
                Assigned Drivers ({viewBus.drivers.length})
              </p>
              <div className="space-y-3">
                {viewBus.drivers.map((d, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-[9px] uppercase font-black text-gray-400 mb-3">Driver {i + 1}</p>
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
              <button onClick={() => setViewBus(null)}
                className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
