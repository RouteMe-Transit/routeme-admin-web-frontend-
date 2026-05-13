"use client";

import { useEffect, useState } from "react";
import api from "@/app/services/api";

type Complaint = {
  id: string;
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
  // STATES
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const stats = [
    { title: "Total This Week", value: complaints.length, icon: "💬" },
    {
      title: "Pending",
      value: complaints.filter((item) => item.status === "Pending").length,
      icon: "⏳",
    },
    {
      title: "Resolved",
      value: complaints.filter((item) => item.status === "Resolved").length,
      icon: "✅",
    },
  ];

  const getAuthConfig = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    console.log("Token retrieved:", token);

    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  };

  // STATUS TOGGLE
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
            ? {
                ...item,
                status: updatedComplaint?.status || newStatus,
              }
            : item
        )
      );
    } catch (err: any) {
      console.error("Error updating complaint status:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update complaint status. Please try again.";
      setError(message);
    }
  };

  // FILTER LOGIC
  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      setError("");

      try {
        const config = getAuthConfig();
        console.log("Auth config for GET /complaints:", config);
        const response = await api.get("/complaints", config);
        const rawData = response.data?.data || response.data;
        const complaintsArray =
          Array.isArray(rawData) ? rawData : rawData?.complaints ?? [];
        const normalized = complaintsArray.map((item: any) => ({
          id: item.id?.toString() || "",
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
        console.error("Error loading complaints:", err);
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
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

    const matchStatus =
      statusFilter === "All" || item.status === statusFilter;

    const matchCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="min-h-screen p-8 ">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* STATS (FIXED ORIGINAL LAYOUT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className="text-3xl">{stat.icon}</div>

            <div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-sm">
                {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search complaints..."
          className="w-full md:w-1/2 px-4 py-2 rounded-xl border outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-xl"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-xl"
        >
          <option value="All">All Category</option>
          <option value="Punctuality">Punctuality</option>
          <option value="Driver Behavior">Driver Behavior</option>
          <option value="Route Issue">Route Issue</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-8 px-4 py-3 border-b text-gray-500 text-sm">
          <div>ID</div>
          <div>Passenger</div>
          <div>Category</div>
          <div>Bus</div>
          <div>Message</div>
          <div>Date</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        {/* ROWS */}
        <div>
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading complaints...</div>
          ) : (
            filteredComplaints.map((item) => {
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-8 px-4 py-3 border-b hover:bg-gray-50 items-center"
                >
                  <div>{item.id}</div>
                  <div>{item.passenger}</div>
                  <div>{item.category}</div>
                  <div>{item.bus}</div>
                  <div className="truncate">{item.message}</div>
                  <div>{item.date}</div>

                  {/* STATUS */}
                  <div>
                    <span
                      className={`px-3 py-1 text-xs rounded-lg font-semibold ${
                        item.status === "Resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                    >
                      View
                    </button>

                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`px-2 py-1 text-xs rounded text-white ${
                        item.status === "Pending"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {item.status === "Pending"
                        ? "Mark Resolved"
                        : "Mark Pending"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">
            <h2 className="text-lg font-bold mb-4">
              Complaint Details
            </h2>

            <p>
              <b>ID:</b> {selectedComplaint.id}
            </p>
            <p>
              <b>Passenger:</b> {selectedComplaint.passenger}
            </p>
            <p>
              <b>Category:</b> {selectedComplaint.category}
            </p>
            <p>
              <b>Bus:</b> {selectedComplaint.bus}
            </p>
            <p>
              <b>Date:</b> {selectedComplaint.date}
            </p>

            <p className="mt-2">
              <b>Message:</b>
            </p>
            <p className="text-gray-600">
              {selectedComplaint.message}
            </p>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
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