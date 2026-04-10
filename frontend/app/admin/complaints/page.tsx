"use client";

import { useState } from "react";

type Complaint = {
  id: string;
  passenger: string;
  category: string;
  bus: string;
  message: string;
  date: string;
  status: "Pending" | "Resolved";
};

export default function AdminComplaints() {
  const stats = [
    { title: "Total This Week", value: 42, icon: "💬" },
    { title: "Pending", value: 14, icon: "⏳" },
    { title: "Resolved", value: 28, icon: "✅" },
  ];

  const initialComplaints: Complaint[] = [
    {
      id: "C-101",
      passenger: "K.Senarathna",
      category: "Punctuality",
      bus: "Bus 12",
      message:
        "Bus was 15 mins late due to traffic congestion near Colombo road.",
      date: "Mar 5, 2026",
      status: "Resolved",
    },
    {
      id: "C-102",
      passenger: "S.Rathnayake",
      category: "Driver Behavior",
      bus: "Bus 45",
      message: "Driver was rude and refused to stop at designated stop.",
      date: "Mar 5, 2026",
      status: "Resolved",
    },
    {
      id: "C-103",
      passenger: "M.Fernando",
      category: "Punctuality",
      bus: "Bus 7",
      message:
        "Bus missed the stop even after signaling multiple times.",
      date: "Mar 3, 2026",
      status: "Pending",
    },
    {
      id: "C-104",
      passenger: "T.Kumara",
      category: "Route Issue",
      bus: "Bus 35",
      message:
        "Route was changed without prior notice causing confusion.",
      date: "Mar 5, 2026",
      status: "Pending",
    },
  ];

  // STATES
  const [complaints, setComplaints] =
    useState<Complaint[]>(initialComplaints);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  // STATUS TOGGLE
  const toggleStatus = (id: string) => {
    setComplaints((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Pending" ? "Resolved" : "Pending",
            }
          : item
      )
    );
  };

  // FILTER LOGIC
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
          {filteredComplaints.map((item) => (
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
          ))}
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