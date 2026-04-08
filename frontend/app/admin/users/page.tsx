"use client";

import { useState } from "react";
import Swal from "sweetalert2";

type UserStatus = "Active" | "Suspended";
type UserRole = "Passenger" | "Bus" | "Admin";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  joined: string;
  status: UserStatus;
  role: UserRole;
};

const AVATAR_COLORS = [
  "bg-purple-500", "bg-teal-500", "bg-orange-400", "bg-green-500",
  "bg-red-400", "bg-blue-500", "bg-pink-500", "bg-indigo-500",
  "bg-yellow-500", "bg-cyan-500",
];

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const initialUsers: User[] = [
  { id: 0, name: "K. Jayawardane", email: "kavindra1@gmail.com", phone: "0771234501", joined: "Jan 2026", status: "Active", role: "Passenger" },
  { id: 1, name: "T.D. Fernando", email: "tiranfernando@gmail.com", phone: "0712345602", joined: "Jan 2026", status: "Active", role: "Passenger" },
  { id: 2, name: "O.A. Athuraliya", email: "ottara253@gmail.com", phone: "0763456703", joined: "Feb 2026", status: "Active", role: "Passenger" },
  { id: 3, name: "W.D. Ashley", email: "ashley2002@gmail.com", phone: "0704567804", joined: "Feb 2026", status: "Active", role: "Passenger" },
  { id: 4, name: "A.M. Subasinghe", email: "subasinghe42@gmail.com", phone: "0755678905", joined: "Feb 2026", status: "Active", role: "Passenger" },
  { id: 5, name: "S. Dayaruwan", email: "sithijadayaruwan@gmail.com", phone: "0776789006", joined: "Mar 2026", status: "Active", role: "Passenger" },
  { id: 6, name: "H.K. Thisara", email: "thisara99@gmail.com", phone: "0727890107", joined: "Mar 2026", status: "Active", role: "Passenger" },
  { id: 7, name: "U. Marapana", email: "udanamarapana@gmail.com", phone: "0788901208", joined: "Apr 2026", status: "Active", role: "Passenger" },
  { id: 8, name: "R. Perera", email: "ravinduperera@gmail.com", phone: "0771084233", joined: "Jan 2026", status: "Active", role: "Bus" },
  { id: 9, name: "S. Kavindu", email: "kavindu2005@gmail.com", phone: "0712989647", joined: "Jan 2026", status: "Active", role: "Bus" },
  { id: 10, name: "M. Anusha", email: "malinduanusha@gmail.com", phone: "0764374495", joined: "Feb 2026", status: "Suspended", role: "Bus" },
  { id: 11, name: "A. Saman", email: "aluthgesaman83@gmail.com", phone: "0701648266", joined: "Mar 2026", status: "Active", role: "Bus" },
  { id: 12, name: "S.P. Dissanayake", email: "darshana5@routeme.lk", phone: "0772459001", joined: "Jan 2026", status: "Active", role: "Admin" },
  { id: 13, name: "Y.M. Chanaka", email: "chanakayasas@routeme.lk", phone: "0720865902", joined: "Jan 2026", status: "Active", role: "Admin" },
  { id: 14, name: "T. Michelle", email: "michelletatiana@routeme.lk", phone: "0778763433", joined: "Feb 2026", status: "Active", role: "Admin" },
];

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: "bg-[#61de9f] text-[#00796b]",
  Suspended: "bg-red-50 text-red-600",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<UserRole>("Passenger");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All Status">("All Status");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [modalRole, setModalRole] = useState<UserRole>("Bus");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formError, setFormError] = useState("");

  const totalPassengers = users.filter((u) => u.role === "Passenger").length;
  const totalBus = users.filter((u) => u.role === "Bus").length;
  const totalAdmins = users.filter((u) => u.role === "Admin").length;
  const totalSuspended = users.filter((u) => u.status === "Suspended").length;

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchTab = u.role === activeTab;
    const matchStatus = statusFilter === "All Status" || u.status === statusFilter;
    return matchSearch && matchTab && matchStatus;
  });

  const openAddModal = (role: UserRole) => {
    setEditingUser(null);
    setModalRole(role);
    setForm({ name: "", email: "", phone: "" });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setModalRole(user.role);
    setForm({ name: user.name, email: user.email, phone: user.phone });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = () => {
    const nameRegex = /^([A-Z]\.)+[A-Za-z]{2,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^07[0-9]{8}$/;

    if (!form.name || !form.email || !form.phone) {
      setFormError("All fields are mandatory.");
      return;
    }
    if (!nameRegex.test(form.name)) {
      setFormError("Format Error: Name must be like 'K.D.Senarathne'.");
      return;
    }
    if (!emailRegex.test(form.email)) {
      setFormError("Format Error: Please enter a valid email address.");
      return;
    }
    if (!phoneRegex.test(form.phone)) {
      setFormError("Format Error: Phone must be 10 digits starting with 07.");
      return;
    }

    if (editingUser) {
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, ...form } : u));
    } else {
      const newUser: User = {
        id: Date.now(),
        ...form,
        joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        status: "Active",
        role: modalRole,
      };
      setUsers((prev) => [...prev, newUser]);
      setActiveTab(modalRole);
    }

    setShowModal(false);
    setFormError("");
    Swal.fire({ icon: 'success', title: editingUser ? 'Details Updated' : 'Account Created', timer: 1500, showConfirmButton: false });
  };

  const handleDelete = async (user: User) => {
    const result = await Swal.fire({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px 0">
                <img src="/icons/delete.png" style="width:30px;height:30px;margin-bottom:5px" alt="delete" />
                <p style="color:#374151;font-size:13px;font-weight:700;margin:0">Remove ${user.name}?</p>
                <p style="color:#9ca3af;font-size:11px;margin:0">${user.email} · Permanent Deletion</p>
             </div>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove User",
    });
    if (result.isConfirmed) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  };

  const handleToggleSuspend = async (user: User) => {
    const isSuspending = user.status === "Active";
    const result = await Swal.fire({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 0">
              <div style="width:50px;height:50px;background-color:${isSuspending ? '#fff1f2' : '#f0fdf4'};border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:8px">
                <span style="font-size:24px;">${isSuspending ? '🚫' : '✅'}</span>
              </div>
              <p style="color:#111827;font-size:14px;font-weight:700;margin:0">${isSuspending ? 'Suspend' : 'Reactivate'} ${user.name}?</p>
              <p style="color:#6b7280;font-size:12px;margin:0;text-align:center">This will ${isSuspending ? 'restrict' : 'restore'} access for <b>${user.email}</b></p>
            </div>`,
      showCancelButton: true,
      confirmButtonColor: isSuspending ? "#ef4444" : "#4CAF8A",
      confirmButtonText: isSuspending ? "Confirm Suspension" : "Reactivate User",
      width: 320,
    });

    if (result.isConfirmed) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: isSuspending ? "Suspended" : "Active" } : u));
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Status updated`, showConfirmButton: false, timer: 2000 });
    }
  };

  return (
    <div className="p-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/passenger.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-black">{totalPassengers}</p><p className="text-[#94a0ae] text-sm">Passengers</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/fleet.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-black">{totalBus}</p><p className="text-[#94a0ae] text-sm">Buses</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/admin.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-black">{totalAdmins}</p><p className="text-[#94a0ae] text-sm">Admins</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/warning.png" className="w-12 h-12 object-contain" />
          <div><p className="text-3xl font-extrabold text-red-500">{totalSuspended}</p><p className="text-[#94a0ae] text-sm">Suspended</p></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-72 shadow-sm">
          <img src="/icons/lens.png" className="w-5 h-5 opacity-50" />
          <input type="text" placeholder="Search by name, email..." className="flex-1 text-sm bg-transparent outline-none text-black" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(["Passenger", "Bus", "Admin"] as UserRole[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-1.5 rounded-md text-sm font-semibold transition ${activeTab === tab ? "bg-[#122843] text-white shadow" : "text-gray-500 hover:text-gray-700"}`}>{tab}</button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => openAddModal("Bus")} className="h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-sm">Add Bus</button>
          <button onClick={() => openAddModal("Admin")} className="h-10 bg-[#e8b84b] text-white font-semibold px-6 rounded-lg hover:bg-[#d4a53e] transition shadow-sm">Add Admin</button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-6 bg-[#f5f8fc] px-4 py-3 text-sm font-extrabold text-gray-700 border-b uppercase">
          <div>User</div><div>Email</div><div>Phone</div><div>Joined</div><div>Status</div><div className="text-center">Action</div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No users found.</div>
        ) : (
          filtered.map((user) => (
            <div key={user.id} className="grid grid-cols-6 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(user.id)}`}>{getInitial(user.name)}</div>
                <span className="font-semibold">{user.name}</span>
              </div>
              <div className="text-gray-500 truncate mr-2">{user.email}</div>
              <div>{user.phone}</div>
              <div>{user.joined}</div>
              <div><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[user.status]}`}>{user.status}</span></div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setViewUser(user)} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition"><img src="/icons/view.png" className="w-5 h-5" /></button>
                <button onClick={() => openEditModal(user)} className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 transition"><img src="/icons/edit.png" className="w-4 h-4" /></button>
                <button onClick={() => handleToggleSuspend(user)} className={`w-8 h-8 rounded-full flex items-center justify-center transition ${user.status === "Active" ? "bg-orange-50 hover:bg-orange-100" : "bg-green-50 hover:bg-green-100"}`}>
                  <span className="text-lg leading-none">{user.status === "Active" ? "🚫" : "✅"}</span>
                </button>
                <button onClick={() => handleDelete(user)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition"><img src="/icons/delete.png" className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md mx-4">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500" onClick={() => setShowModal(false)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <img src={modalRole === "Bus" ? "/icons/fleet.png" : "/icons/admin.png"} className="w-10 h-10 object-contain" />
              {editingUser ? `Update ${modalRole}` : `Add New ${modalRole}`}
            </h2>

            {formError && <div className="mb-4 text-[10px] font-black text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-widest">⚠️ {formError}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-wider">Full Name</label>
                <input className="w-full h-10 border rounded-lg px-3 text-sm focus:border-[#4CAF8A] outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. K.D.Senarathne" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-wider">Email Address</label>
                <input className="w-full h-10 border rounded-lg px-3 text-sm focus:border-[#4CAF8A] outline-none" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@routeme.lk" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-wider">Phone Number</label>
                <input className="w-full h-10 border rounded-lg px-3 text-sm focus:border-[#4CAF8A] outline-none" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07xxxxxxxx" maxLength={10} />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200" onClick={() => setShowModal(false)}>Discard</button>
              <button className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg" onClick={handleSave}>Save {modalRole}</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl p-7 relative">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-black" onClick={() => setViewUser(null)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(viewUser.id)}`}>{getInitial(viewUser.name)}</div>
              User Profile
            </h2>
            <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Full Name</p><p className="font-bold text-gray-800">{viewUser.name}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Email</p><p className="font-bold text-gray-800">{viewUser.email}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Phone</p><p className="font-bold text-gray-800">{viewUser.phone}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">System Role</p><p className="font-bold text-gray-800">{viewUser.role}</p></div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Account Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewUser.status]}`}>{viewUser.status}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewUser(null)} className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}