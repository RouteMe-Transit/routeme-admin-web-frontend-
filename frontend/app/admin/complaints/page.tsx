"use client";

import { useEffect, useState } from "react";
import api from "@/app/services/api";
import { IoSearch, IoEye } from "react-icons/io5";
import { FiAlertOctagon, FiCheckCircle, FiMessageCircle } from "react-icons/fi";

type Complaint = {
  id: string;
  displayId?: string;
  passenger: string;
  category: string;
  bus: string;
  message: string;
  date: string;
  status: "Pending" | "Resolved";
  createdAt?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  busNumber?: string;
  description?: string;
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function formatComplaintId(rawId: string, prefix = "CP", width = 4): string {
    const text = String(rawId).trim();
    const digits = text.match(/(\d+)$/)?.[1] ?? text.replace(/\D/g, "");
    return digits ? `${prefix}${digits.padStart(width, "0")}` : text;
  }

  const stats = [
    {
      title: "Total This Week",
      value: complaints.length,
      icon: <FiMessageCircle className="h-6 w-6 text-blue-500" />,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Pending",
      value: complaints.filter((item) => item.status === "Pending").length,
      icon: <FiAlertOctagon className="h-6 w-6 text-amber-500" />,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      title: "Resolved",
      value: complaints.filter((item) => item.status === "Resolved").length,
      icon: <FiCheckCircle className="h-6 w-6 text-emerald-500" />,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
  ];

  const getAuthConfig = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  };

  const toggleStatus = async (id: string) => {
    try {
      const current = complaints.find((item) => item.id === id);
      if (!current) return;

      const newStatus = current.status === "Pending" ? "Resolved" : "Pending";
      const response = await api.patch(
        `/complaints/${id}/status`,
        { status: newStatus },
        getAuthConfig()
      );
      const updatedComplaint = response.data?.data || response.data;

      setComplaints((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: updatedComplaint?.status || newStatus }
            : item
        )
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update complaint status. Please try again.";
      setError(message);
    }
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      setError("");
      try {
        const config = getAuthConfig();
        const response = await api.get("/complaints", config);
        const rawData = response.data?.data || response.data;
        const complaintsArray =
          Array.isArray(rawData) ? rawData : rawData?.complaints ?? [];
        const normalized = complaintsArray.map((item: any) => ({
          id: item.id?.toString() || "",
          displayId: formatComplaintId(item.id?.toString() || ""),
          passenger:
            item.passenger ||
            (item.user?.firstName && item.user?.lastName
              ? `${item.user.firstName} ${item.user.lastName}`
              : item.user?.email || "Unknown Passenger"),
          category: item.category || "",
          bus: item.bus || item.busNumber || "",
          message: item.message || item.description || "",
          date: item.date || new Date(item.createdAt).toLocaleDateString(),
          status: item.status || "Pending",
          user: item.user,
          busNumber: item.busNumber,
          description: item.description,
          createdAt: item.createdAt,
        }));
        setComplaints(normalized);
      } catch (err: any) {
        setError("Unable to load complaints. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filteredComplaints = complaints.filter((item) => {
    const matchSearch =
      item.passenger.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || item.status === statusFilter;
    const matchCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl ${stat.bg} shrink-0`}
            >
              {stat.icon}
            </div>
            <div>
              <p className={`text-3xl font-black tracking-tight ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-gray-400">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg border border-[#828282]/40 bg-white px-3 py-2 shadow-sm w-full md:w-80">
          <IoSearch className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search complaints..."
            className="flex-1 bg-transparent text-sm outline-none text-black"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 cursor-pointer rounded-lg border border-[#828282]/40 bg-white px-3 text-sm shadow-sm"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 cursor-pointer rounded-lg border border-[#828282]/40 bg-white px-3 text-sm shadow-sm"
        >
          <option value="All">All Category</option>
          <option value="Punctuality">Punctuality</option>
          <option value="Driver Behavior">Driver Behavior</option>
          <option value="Route Issue">Route Issue</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-max grid grid-cols-[110px_1.3fr_1fr_1fr_1.6fr_120px_120px_140px] border-b bg-[#f8fafc] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500">
            <div>ID</div>
            <div>Passenger</div>
            <div>Category</div>
            <div>Bus</div>
            <div>Message</div>
            <div>Date</div>
            <div>Status</div>
            <div className="text-center">Actions</div>
          </div>

          <div>
            {isLoading ? (
              <div className="p-8 text-center text-sm font-semibold text-gray-500">
                Loading complaints...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-gray-400">
                No complaints found.
              </div>
            ) : (
              filteredComplaints.map((item) => (
                <div
                  key={item.id}
                  className="min-w-max grid grid-cols-[110px_1.3fr_1fr_1fr_1.6fr_120px_120px_140px] items-center border-b px-5 py-3.5 text-sm transition-colors hover:bg-blue-50/30"
                >
                  <div className="font-mono text-xs font-bold tracking-wider text-gray-400">
                    {item.displayId ?? item.id}
                  </div>
                  <div className="min-w-0 font-semibold text-gray-800 truncate pr-2">
                    {item.passenger}
                  </div>
                  <div className="text-gray-700">{item.category}</div>
                  <div className="text-gray-700">{item.bus}</div>
                  <div className="truncate text-gray-700 pr-2">{item.message}</div>
                  <div className="font-mono text-xs text-gray-500">{item.date}</div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.status === "Resolved"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : "border-amber-300 bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-100"
                      title="View complaint"
                    >
                      <IoEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition ${
                        item.status === "Pending"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      {item.status === "Pending" ? "Mark Resolved" : "Mark Pending"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg mx-4">
            <h2 className="mb-4 text-lg font-bold">Complaint Details</h2>
            <p className="mb-1">
              <b>ID:</b> {selectedComplaint.displayId ?? selectedComplaint.id}
            </p>
            <p className="mb-1">
              <b>Passenger:</b> {selectedComplaint.passenger}
            </p>
            <p className="mb-1">
              <b>Category:</b> {selectedComplaint.category}
            </p>
            <p className="mb-1">
              <b>Bus:</b> {selectedComplaint.bus}
            </p>
            <p className="mb-1">
              <b>Date:</b> {selectedComplaint.date}
            </p>
            <p className="mt-2">
              <b>Message:</b>
            </p>
            <p className="text-gray-600 mt-1">{selectedComplaint.message}</p>
            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-300 transition"
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