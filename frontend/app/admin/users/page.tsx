"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { z, ZodIssue } from "zod";
import {
  IoEye,
  IoPencil,
  IoBan,
  IoTrash,
  IoSearch,
  IoPersonAdd,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { FiUsers, FiShield, FiUserX } from "react-icons/fi";
import { MdVerified } from "react-icons/md";

// ─── Types ──────────────────────────────────────────────────────────────────
type UserRole = "admin" | "passenger" | "bus";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  subscribedRoutes: string[];
  isActive: boolean;
  createdAt: string;
};

// ─── Zod Schemas ────────────────────────────────────────────────────────────
const createAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "Too long"),
  lastName:  z.string().min(1, "Last name is required").max(50, "Too long"),
  email:     z.string().email("Please enter a valid email address"),
  phone:     z.string().optional(),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

const editAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "Too long"),
  lastName:  z.string().min(1, "Last name is required").max(50, "Too long"),
  email:     z.string().email("Please enter a valid email address"),
  phone:     z.string().optional(),
  password:  z
    .string()
    .refine(
      (val) => val === "" || val.length >= 8,
      "Password must be at least 8 characters"
    )
    .refine(
      (val) => val === "" || /[A-Z]/.test(val),
      "Must contain at least one uppercase letter"
    )
    .refine(
      (val) => val === "" || /[0-9]/.test(val),
      "Must contain at least one number"
    ),
});

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

// ─── API helper ──────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Request failed");
  return json.data as T;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (f: string, l: string) =>
  `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

const AVATAR_COLORS = [
  "bg-orange-400","bg-emerald-500","bg-teal-500","bg-blue-500",
  "bg-violet-500","bg-pink-500","bg-rose-400","bg-indigo-500",
  "bg-cyan-500","bg-amber-500",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const fmtId = (role: UserRole, id: number) => {
  const p = role === "admin" ? "ADM" : role === "passenger" ? "PAS" : "BUS";
  return `${p}${String(id).padStart(4, "0")}`;
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", year: "numeric" });

const emptyForm = (): FormValues => ({
  firstName: "",
  lastName:  "",
  email:     "",
  phone:     "",
  password:  "",
});

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
const inputBase =
  "w-full h-10 border rounded-lg px-3 text-sm outline-none transition bg-white";
const inputNormal = `${inputBase} border-gray-200 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const inputError  = `${inputBase} border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/30`;
const labelCls    = "block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest";

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminManageUsers() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<"admin" | "passenger">("admin");
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState<"All Status" | "active" | "inactive">("All Status");
  const [showModal,   setShowModal]   = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewUser,    setViewUser]    = useState<User | null>(null);
  const [form,        setForm]        = useState<FormValues>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ total: number; users: User[] }>("/users");
      setUsers(res.users ?? []);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to load users",
        text: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)  ||
      u.email?.toLowerCase().includes(q);
    const matchTab    = u.role === activeTab;
    const matchStatus =
      statusFilter === "All Status" ||
      (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchSearch && matchTab && matchStatus;
  });

  const passengerCount = users.filter((u) => u.role === "passenger").length;
  const adminCount     = users.filter((u) => u.role === "admin").length;
  const suspendedCount = users.filter((u) => !u.isActive).length;

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setFieldErrors({});
    setApiError("");
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone ?? "",
      password:  "",
    });
    setFieldErrors({});
    setApiError("");
    setShowModal(true);
  };

  // ── Save with Zod validation ──────────────────────────────────────────────
  const handleSave = async () => {
    const schema = editingUser ? editAdminSchema : createAdminSchema;
    const result = schema.safeParse(form);

    if (!result.success) {
      const errs: FieldErrors = {};
      result.error.issues.forEach((e: ZodIssue) => {
        const field = e.path[0] as keyof FormValues;
        if (!errs[field]) errs[field] = e.message;
      });
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setApiError("");

    const payload: Record<string, unknown> = {
      firstName: form.firstName,
      lastName:  form.lastName,
      email:     form.email,
      phone:     form.phone || undefined,
      role:      editingUser ? editingUser.role : "admin",
    };
    if (form.password) payload.password = form.password;

    try {
      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        Swal.fire({ icon: "success", title: "User Updated", timer: 1500, showConfirmButton: false });
      } else {
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        Swal.fire({ icon: "success", title: "Admin Created", timer: 1500, showConfirmButton: false });
      }
      await loadUsers();
      setShowModal(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Save failed");
    }
  };

  // ── Suspend ───────────────────────────────────────────────────────────────
  const handleSuspend = async (user: User) => {
    const confirm = await Swal.fire({
      title: `Suspend ${user.firstName}?`,
      text: "Their account will be deactivated.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, suspend",
    });
    if (!confirm.isConfirmed) return;
    try {
      await apiFetch(`/users/${user.id}`, { method: "DELETE" });
      await loadUsers();
      Swal.fire({ icon: "success", title: "User suspended", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: err instanceof Error ? err.message : "Failed" });
    }
  };

  // ── Reactivate ────────────────────────────────────────────────────────────
  const handleReactivate = async (user: User) => {
    const confirm = await Swal.fire({
      title: `Reactivate ${user.firstName}?`,
      text: "Their account will be restored and they can log in again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Yes, reactivate",
    });
    if (!confirm.isConfirmed) return;
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: true }),
      });
      await loadUsers();
      Swal.fire({ icon: "success", title: "User reactivated", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: err instanceof Error ? err.message : "Failed" });
    }
  };

  const setField = (key: keyof FormValues, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-full">

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<FiUsers   className="w-6 h-6 text-blue-500"  />} bg="bg-blue-50"  value={passengerCount} label="Total Passengers" color="text-blue-600"  />
        <StatCard icon={<FiShield  className="w-6 h-6 text-amber-500" />} bg="bg-amber-50" value={adminCount}     label="Total Admins"     color="text-amber-600" />
        <StatCard icon={<FiUserX   className="w-6 h-6 text-red-400"   />} bg="bg-red-50"   value={suspendedCount} label="Suspended Users"  color="text-red-500"   />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-64 shadow-sm">
          <IoSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <select
          className="h-10 border border-gray-200 rounded-xl px-3 bg-white text-sm text-gray-700 shadow-sm outline-none cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="All Status">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["passenger", "admin"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#122843] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Add Admin — admin tab only */}
        {activeTab === "admin" && (
          <button
            onClick={openAdd}
            className="ml-auto h-10 bg-[#f5a623] hover:bg-[#e09510] active:scale-95 text-white font-bold px-5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2"
          >
            <IoPersonAdd className="w-4 h-4" />
            Add Admin
          </button>
        )}
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="grid grid-cols-[110px_180px_220px_130px_90px_100px_116px] bg-[#f8fafc] px-5 py-3 text-[11px] font-black text-gray-500 border-b uppercase tracking-widest">
          <div>User ID</div>
          <div>Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Joined</div>
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
            <span className="text-sm font-semibold">Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
            <FiUsers className="w-8 h-8 opacity-30" />
            <p className="text-sm font-semibold">No {activeTab} users found.</p>
          </div>
        ) : (
          filtered.map((user, idx) => (
            <div
              key={user.id}
              className={`grid grid-cols-[110px_180px_220px_130px_90px_100px_116px] items-center px-5 py-3.5 border-b transition-colors duration-150 ${
                idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
              } hover:bg-blue-50/30`}
            >
              {/* ID */}
              <div className="font-mono text-[11px] font-bold text-gray-400 tracking-wider">
                {fmtId(user.role, user.id)}
              </div>

              {/* Name + avatar */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full ${avatarColor(user.id)} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm ring-2 ring-white`}>
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <span className="font-semibold text-gray-800 truncate text-[13px] leading-snug">
                  {user.firstName} {user.lastName}
                </span>
              </div>

              {/* Email */}
              <div className="text-gray-500 text-xs truncate pr-3 font-medium">
                {user.email}
              </div>

              {/* Phone */}
              <div className="text-gray-500 text-xs font-medium">
                {user.phone || "—"}
              </div>

              {/* Joined */}
              <div className="text-gray-400 text-xs font-semibold">
                {fmtDate(user.createdAt)}
              </div>

              {/* Status */}
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  user.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-1.5">
                {/* View */}
                <button
                  onClick={() => setViewUser(user)}
                  title="View details"
                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 flex items-center justify-center transition-all active:scale-90"
                >
                  <IoEye className="w-4 h-4" />
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(user)}
                  title="Edit user"
                  className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700 flex items-center justify-center transition-all active:scale-90"
                >
                  <IoPencil className="w-3.5 h-3.5" />
                </button>

                {/* Suspend (active) / Reactivate (inactive) */}
                {user.isActive ? (
                  <button
                    onClick={() => handleSuspend(user)}
                    title="Suspend user"
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all active:scale-90"
                  >
                    <IoBan className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(user)}
                    title="Reactivate user"
                    className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 flex items-center justify-center transition-all active:scale-90"
                  >
                    <IoCheckmarkCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative max-h-[92vh] overflow-y-auto">

            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm"
            >✕</button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-black text-[#122843] tracking-tight">
                {editingUser ? "Edit User" : "Add New Admin"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {editingUser
                  ? `Editing account — ${fmtId(editingUser.role, editingUser.id)}`
                  : "Create a new administrator account"}
              </p>
            </div>

            {/* API-level error */}
            {apiError && (
              <div className="mb-5 flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
                <span className="mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  className={fieldErrors.firstName ? inputError : inputNormal}
                  placeholder="Kavindu"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
                <FieldError msg={fieldErrors.firstName} />
              </div>

              {/* Last Name */}
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  className={fieldErrors.lastName ? inputError : inputNormal}
                  placeholder="Perera"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
                <FieldError msg={fieldErrors.lastName} />
              </div>

              {/* Email */}
              <div className="col-span-2">
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  className={fieldErrors.email ? inputError : inputNormal}
                  placeholder="admin@routeme.lk"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
                <FieldError msg={fieldErrors.email} />
              </div>

              {/* Phone */}
              <div className="col-span-2">
                <label className={labelCls}>Phone Number <span className="normal-case font-medium text-gray-300">(optional)</span></label>
                <input
                  className={inputNormal}
                  placeholder="07xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="col-span-2">
                <label className={labelCls}>
                  {editingUser
                    ? "New Password"
                    : "Password"}
                  {editingUser && (
                    <span className="normal-case font-medium text-gray-300 ml-1">(leave blank to keep current)</span>
                  )}
                </label>
                <input
                  type="password"
                  className={fieldErrors.password ? inputError : inputNormal}
                  placeholder={editingUser ? "Leave blank to keep unchanged" : "Min. 8 chars, 1 uppercase, 1 number"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                />
                <FieldError msg={fieldErrors.password} />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2 rounded-xl bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition active:scale-95"
              >
                {editingUser ? "Save Changes" : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl p-7 relative">

            <button
              onClick={() => setViewUser(null)}
              className="absolute right-5 top-5 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition font-black text-sm"
            >✕</button>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-full ${avatarColor(viewUser.id)} flex items-center justify-center text-white text-xl font-black shadow-md ring-4 ring-white`}>
                {getInitials(viewUser.firstName, viewUser.lastName)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-black text-[#122843] tracking-tight">
                    {viewUser.firstName} {viewUser.lastName}
                  </h2>
                  {viewUser.isActive && (
                    <MdVerified className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-mono font-bold tracking-widest mt-0.5">
                  {fmtId(viewUser.role, viewUser.id)}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-gray-50/80 p-5 rounded-xl border border-gray-100">
              {[
                ["Email",  viewUser.email],
                ["Phone",  viewUser.phone || "—"],
                ["Role",   viewUser.role.charAt(0).toUpperCase() + viewUser.role.slice(1)],
                ["Status", viewUser.isActive ? "Active" : "Inactive"],
                ["Joined", fmtDate(viewUser.createdAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-0.5 tracking-widest">
                    {label}
                  </p>
                  <p className="font-semibold text-gray-800 text-sm break-all leading-snug">
                    {val}
                  </p>
                </div>
              ))}

              {/* Subscribed Routes — passengers only */}
              {viewUser.role === "passenger" && (
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">
                    Subscribed Routes
                  </p>
                  {viewUser.subscribedRoutes?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewUser.subscribedRoutes.map((r) => (
                        <span
                          key={r}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium italic">
                      No subscribed routes yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewUser(null)}
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