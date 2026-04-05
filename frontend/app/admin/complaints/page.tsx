"use client";

export default function AdminComplaints() {
  const stats = [
    { title: "Total This Week", value: 42, icon: "💬" },
    { title: "Pending", value: 14, icon: "⏳" },
    { title: "Resolved", value: 28, icon: "✅" },
  ];

  const complaints = [
    {
      id: "C-101",
      passenger: "K.Senarathna",
      category: "Punctuality",
      bus: "Bus 12",
      message: "Bus was 15 mins late...",
      date: "Mar 5, 2026",
      status: "Resolved",
    },
    {
      id: "C-102",
      passenger: "S.Rathnayake",
      category: "Driver Behavior",
      bus: "Bus 45",
      message: "Driver was rude...",
      date: "Mar 5, 2026",
      status: "Resolved",
    },
    {
      id: "C-103",
      passenger: "M.Fernando",
      category: "Punctuality",
      bus: "Bus 7",
      message: "Missed the stop...",
      date: "Mar 3, 2026",
      status: "Pending",
    },
    {
      id: "C-104",
      passenger: "T.Kumara",
      category: "Route Issue",
      bus: "Bus 35",
      message: "Route was changed...",
      date: "Mar 5, 2026",
      status: "Pending",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Complaints Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className="text-3xl">{stat.icon}</div>
            <div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search complaints..."
          className="w-full md:w-1/2 px-4 py-2 rounded-xl border outline-none"
        />

        <div className="flex gap-4">
          <select className="px-4 py-2 rounded-xl border text-sm">
            <option>All Status</option>
            <option>Pending</option>
            <option>Resolved</option>
          </select>

          <select className="px-4 py-2 rounded-xl border text-sm">
            <option>All Categories</option>
            <option>Punctuality</option>
            <option>Driver Behavior</option>
            <option>Route Issue</option>
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 text-gray-500 text-sm px-4 mb-2">
        <div>#</div>
        <div>Passenger</div>
        <div>Category</div>
        <div>Bus</div>
        <div>Message</div>
        <div>Date</div>
        <div>Status</div>
      </div>

      {/* Cards instead of lines */}
      <div className="flex flex-col gap-4">
        {complaints.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-7 items-center bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition"
          >
            <div>{item.id}</div>
            <div>{item.passenger}</div>
            <div>{item.category}</div>
            <div>{item.bus}</div>
            <div className="truncate">{item.message}</div>
            <div>{item.date}</div>
            <div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  item.status === "Resolved"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}