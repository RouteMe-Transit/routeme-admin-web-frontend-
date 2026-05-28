"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { z, ZodIssue } from "zod";
import {
  IoEye,
  IoPencil,
  IoBan,
  IoCheckmarkCircle,
  IoPersonAdd,
} from "react-icons/io5";
import { FiUsers, FiShield, FiUserX } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Zod Schemas ─────────────────────────────────────────────────────────────
// Phone: Sri Lankan mobile — exactly 10 digits starting with 07
const phoneRegex = /^07[0-9]{8}$/;

const createAdminSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .regex(/^[A-Za-z]+$/, "First name must contain only letters (no numbers or symbols)"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .regex(/^[A-Za-z]+$/, "Last name must contain only letters (no numbers or symbols)"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || phoneRegex.test(v.trim()),
      "Phone must be 10 digits starting with 07 (e.g. 0712345678)"
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const editAdminSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .regex(/^[A-Za-z]+$/, "First name must contain only letters (no numbers or symbols)"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .regex(/^[A-Za-z]+$/, "Last name must contain only letters (no numbers or symbols)"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || phoneRegex.test(v.trim()),
      "Phone must be 10 digits starting with 07 (e.g. 0712345678)"
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

// ─── Password generator (same as bus page) ────────────────────────────────────
function generatePassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (f: string, l: string) =>
  `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

const AVATAR_COLORS = [
  "bg-orange-400", "bg-emerald-500", "bg-teal-500", "bg-blue-500",
  "bg-violet-500", "bg-pink-500", "bg-rose-400", "bg-indigo-500",
  "bg-cyan-500", "bg-amber-500",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const fmtId = (role: UserRole, id: number) => {
  const prefix =
    role === "admin" ? "ADM" : role === "passenger" ? "PAS" : "BUS";
  return `${prefix}${String(id).padStart(4, "0")}`;
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

const emptyForm = (): FormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
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

// ─── Confirm modal (replaces SweetAlert) ─────────────────────────────────────
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
const inputBase =
  "w-full h-10 border rounded-md px-2 text-sm outline-none transition bg-white";
const inputNormal = `${inputBase} border-[#828282]/70 focus:border-[#4CAF8A] focus:ring-1 focus:ring-[#4CAF8A]`;
const inputErr    = `${inputBase} border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-300 bg-red-50/20`;
const labelCls    = "block mb-2 font-semibold text-sm text-gray-700";

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminManageUsers() {
  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<"admin" | "passenger">("admin");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [showModal,    setShowModal]    = useState(false);
  const [editingUser,  setEditingUser]  = useState<User | null>(null);
  const [viewUser,     setViewUser]     = useState<User | null>(null);
  const [form,         setForm]         = useState<FormValues>(emptyForm());
  const [fieldErrors,  setFieldErrors]  = useState<FieldErrors>({});
  const [apiError,     setApiError]     = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  // ── Password state (same pattern as bus page) ─────────────────────────────
  const [passwordMode, setPasswordMode] = useState<"auto" | "custom">("auto");
  const [autoPassword, setAutoPassword] = useState(generatePassword);
  const [showPassword, setShowPassword] = useState(false);

  // ── Confirm modal state ────────────────────────────────────────────────────
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

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ total: number; users: User[] }>("/users");
      setUsers(res.users ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
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
      statusFilter === "" ||
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
    setPasswordMode("auto");
    setAutoPassword(generatePassword());
    setShowPassword(false);
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
    setPasswordMode("auto"); // "auto" in edit = keep existing
    setShowPassword(false);
    setShowModal(true);
  };

  // Clear individual field error when user types
  const setField = (key: keyof FormValues, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ── Save — Zod validates trimmed string values ────────────────────────────
  const handleSave = async () => {
    // Determine final password
    const finalPassword = !editingUser
      ? passwordMode === "auto" ? autoPassword : form.password
      : passwordMode === "custom" ? form.password : ""; // "" = keep existing on edit

    // Build object for Zod — always use trimmed strings
    const toValidate = editingUser
      ? {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim(),
          phone:     form.phone.trim() || undefined,
        }
      : {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim(),
          phone:     form.phone.trim() || undefined,
          password:  finalPassword,
        };

    const schema = editingUser ? editAdminSchema : createAdminSchema;
    const result = schema.safeParse(toValidate);

    if (!result.success) {
      const errs: FieldErrors = {};
      result.error.issues.forEach((e: ZodIssue) => {
        const field = e.path[0] as keyof FormValues;
        if (!errs[field]) errs[field] = e.message;
      });
      setFieldErrors(errs);
      toast.error(result.error.issues[0]?.message ?? "Please fix the errors");
      return;
    }

    // Extra check: edit + custom password provided but too short
    if (editingUser && passwordMode === "custom" && form.password.trim() !== "") {
      if (form.password.length < 8) {
        setFieldErrors((e) => ({ ...e, password: "Password must be at least 8 characters" }));
        toast.error("Password must be at least 8 characters");
        return;
      }
    }

    setFieldErrors({});
    setApiError("");
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      email:     form.email.trim(),
      phone:     form.phone.trim() || undefined,
      role:      editingUser ? editingUser.role : "admin",
    };
    if (finalPassword && finalPassword.trim() !== "") {
      payload.password = finalPassword;
    }

    try {
      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("User updated successfully");
      } else {
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Admin created successfully");
      }
      await loadUsers();
      setShowModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Suspend ───────────────────────────────────────────────────────────────
  const handleSuspend = (user: User) => {
    setConfirmState({
      open: true,
      title: `Suspend ${user.firstName}?`,
      message: "Their account will be deactivated.",
      confirmLabel: "Yes, suspend",
      confirmClass: "bg-red-500 hover:bg-red-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await apiFetch(`/users/${user.id}`, { method: "DELETE" });
          await loadUsers();
          toast.success("User suspended successfully");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to suspend user");
        }
      },
    });
  };

  // ── Reactivate ────────────────────────────────────────────────────────────
  const handleReactivate = (user: User) => {
    setConfirmState({
      open: true,
      title: `Reactivate ${user.firstName}?`,
      message: "Their account will be restored and they can log in again.",
      confirmLabel: "Yes, reactivate",
      confirmClass: "bg-emerald-500 hover:bg-emerald-600",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          await apiFetch(`/users/${user.id}`, {
            method: "PUT",
            body: JSON.stringify({ isActive: true }),
          });
          await loadUsers();
          toast.success("User reactivated successfully");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to reactivate user");
        }
      },
    });
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <section className="p-6">

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<FiUsers  className="w-5 h-5 text-blue-500"  />} bg="bg-blue-50"  value={passengerCount} label="Total Passengers" color="text-blue-600"  />
          <StatCard icon={<FiShield className="w-5 h-5 text-amber-500" />} bg="bg-amber-50" value={adminCount}     label="Total Admins"     color="text-amber-600" />
          <StatCard icon={<FiUserX  className="w-5 h-5 text-red-400"   />} bg="bg-red-50"   value={suspendedCount} label="Suspended Users"  color="text-red-500"   />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="rounded-xl border border-gray-100 mb-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search — identical to alerts page */}
            <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
              <FaMagnifyingGlass className="w-4 h-4 opacity-50" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by name or email..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Tab switcher — Admin tab is amber/yellow */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(["passenger", "admin"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? tab === "admin"
                        ? "bg-[#f5a623] text-white shadow-sm"
                        : "bg-[#122843] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Add Admin — amber/yellow like bus page */}
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
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-max md:min-w-full">

              {/* Header */}
              <div className="grid grid-cols-[90px_180px_220px_130px_90px_110px_116px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
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
                <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading users...</div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No {activeTab} users found</div>
              ) : (
                filtered.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[90px_180px_220px_130px_90px_110px_116px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
                  >
                    {/* ID — same style as alerts page */}
                    <div className="font-semibold text-[#122843] whitespace-nowrap">
                      {fmtId(user.role, user.id)}
                    </div>

                    {/* Name + avatar */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${avatarColor(user.id)} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm`}>
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <span className="font-medium text-gray-800 truncate text-sm">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="text-gray-600 text-sm truncate pr-3">{user.email}</div>

                    {/* Phone */}
                    <div className="text-gray-600 text-sm">{user.phone || "—"}</div>

                    {/* Joined */}
                    <div className="text-gray-600 text-sm">{fmtDate(user.createdAt)}</div>

                    {/* Status — same badge style as alerts page */}
                    <div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${user.isActive ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setViewUser(user)} title="View details" className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition">
                        <IoEye className="text-blue-600 w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(user)} title="Edit user" className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition">
                        <IoPencil className="text-amber-500 w-3.5 h-3.5" />
                      </button>
                      {user.isActive ? (
                        <button onClick={() => handleSuspend(user)} title="Suspend user" className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition">
                          <IoBan className="text-red-400 w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleReactivate(user)} title="Reactivate user" className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 shadow-sm transition">
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
          <div className="relative mx-4 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FaXmark />
            </button>

            <h3 className="mb-1 text-lg font-bold text-gray-800">
              {editingUser ? "Edit User" : "Add New Admin"}
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              {editingUser
                ? `Editing — ${fmtId(editingUser.role, editingUser.id)}`
                : "Create a new administrator account"}
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

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name <span className="text-red-600">*</span></label>
                  <input
                    className={fieldErrors.firstName ? inputErr : inputNormal}
                    placeholder="Kavindu"
                    value={form.firstName}
                    onChange={(e) => {
                      // Strip non-letter characters as user types
                      setField("firstName", e.target.value.replace(/[^A-Za-z]/g, ""));
                    }}
                  />
                  <FieldError msg={fieldErrors.firstName} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-red-600">*</span></label>
                  <input
                    className={fieldErrors.lastName ? inputErr : inputNormal}
                    placeholder="Perera"
                    value={form.lastName}
                    onChange={(e) => {
                      setField("lastName", e.target.value.replace(/[^A-Za-z]/g, ""));
                    }}
                  />
                  <FieldError msg={fieldErrors.lastName} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelCls}>Email Address <span className="text-red-600">*</span></label>
                <input
                  type="email"
                  className={fieldErrors.email ? inputErr : inputNormal}
                  placeholder="admin@routeme.lk"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
                <FieldError msg={fieldErrors.email} />
              </div>

              {/* Phone */}
              <div>
                <label className={labelCls}>
                  Phone Number{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className={fieldErrors.phone ? inputErr : inputNormal}
                  placeholder="0712345678"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => {
                    // Only allow digits
                    setField("phone", e.target.value.replace(/\D/g, ""));
                  }}
                />
                <FieldError msg={fieldErrors.phone} />
                {!fieldErrors.phone && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    10 digits, must start with 07
                  </p>
                )}
              </div>

              {/* ── Password — matches bus page style exactly ── */}
              <div>
                <label className={labelCls}>
                  {editingUser ? "Password" : <>Admin Password <span className="text-red-600">*</span></>}
                </label>

                {/* Mode toggle buttons */}
                <div className="flex gap-2 mb-3">
                  {(["auto", "custom"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPasswordMode(mode);
                        setFieldErrors((e) => ({ ...e, password: undefined }));
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                        passwordMode === mode
                          ? "bg-[#122843] text-white border-[#122843]"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {editingUser
                        ? mode === "auto" ? "🔒 Keep Existing" : "✏️ Set New Password"
                        : mode === "auto" ? "✨ Auto-Generate" : "✏️ Custom Password"}
                    </button>
                  ))}
                </div>

                {/* Auto mode — show generated password with toggle + regenerate */}
                {passwordMode === "auto" && !editingUser && (
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

                {/* Keep existing — just informational */}
                {passwordMode === "auto" && editingUser && (
                  <div className="h-10 border border-dashed border-gray-300 rounded-lg px-3 flex items-center bg-gray-50">
                    <span className="text-xs text-gray-400 italic">
                      Existing password will remain unchanged
                    </span>
                  </div>
                )}

                {/* Custom password input */}
                {passwordMode === "custom" && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={fieldErrors.password ? inputErr : inputNormal}
                      placeholder={
                        editingUser
                          ? "Enter new password (min. 8 chars)"
                          : "Min. 8 chars, 1 uppercase, 1 number"
                      }
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
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

                <FieldError msg={fieldErrors.password} />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {!editingUser && passwordMode === "auto"
                    ? "A secure password has been generated. Share it with the admin."
                    : !editingUser && passwordMode === "custom"
                    ? "Enter a strong password: min 8 chars, 1 uppercase, 1 number."
                    : editingUser && passwordMode === "auto"
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
                {submitting ? "Saving..." : editingUser ? "Save Changes" : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">

            <button
              type="button"
              aria-label="Close view modal"
              onClick={() => setViewUser(null)}
              className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
            >
              <FaXmark />
            </button>

            <h3 className="mb-5 text-lg font-bold text-gray-800">User Details</h3>

            <div className="flex items-center gap-4 mb-5">
              <div className={`w-12 h-12 rounded-full ${avatarColor(viewUser.id)} flex items-center justify-center text-white text-lg font-black shadow-md`}>
                {getInitials(viewUser.firstName, viewUser.lastName)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[#122843]">
                    {viewUser.firstName} {viewUser.lastName}
                  </h2>
                  {viewUser.isActive && (
                    <MdVerified className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  {fmtId(viewUser.role, viewUser.id)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Email:</strong> {viewUser.email}</p>
              <p><strong>Phone:</strong> {viewUser.phone || "—"}</p>
              <p><strong>Role:</strong> {viewUser.role.charAt(0).toUpperCase() + viewUser.role.slice(1)}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${viewUser.isActive ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                  {viewUser.isActive ? "Active" : "Inactive"}
                </span>
              </p>
              <p><strong>Joined:</strong> {fmtDate(viewUser.createdAt)}</p>
            </div>

            {viewUser.role === "passenger" && (
              <div className="mt-4 rounded-md bg-gray-100 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Subscribed Routes</p>
                {viewUser.subscribedRoutes?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewUser.subscribedRoutes.map((r) => (
                      <span key={r} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No subscribed routes yet.</p>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewUser(null)}
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