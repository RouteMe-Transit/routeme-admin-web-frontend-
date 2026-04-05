"use client";

import {
  Bus,
  Map,
  Users,
  MessageCircle,
  Clock,
} from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Active Buses",
      value: "247",
      sub: "+12",
      type: "positive",
      icon: Bus,
      color: "text-yellow-500",
      bg: "bg-yellow-100",
    },
    {
      title: "Routes",
      value: "18",
      sub: "All Active",
      type: "positive",
      icon: Map,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      title: "Passengers Today",
      value: "1842",
      sub: "+8%",
      type: "positive",
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
    },
    {
      title: "New Complaints",
      value: "14",
      sub: "Action Needed",
      type: "negative",
      icon: MessageCircle,
      color: "text-red-500",
      bg: "bg-red-100",
    },
    {
      title: "On-Time Rate",
      value: "94%",
      sub: "Good",
      type: "positive",
      icon: Clock,
      color: "text-green-500",
      bg: "bg-green-100",
    },
  ];

  const busFleetData = [
    {
      bus: "NA-2203",
      route: "Route 120",
      routeDesc: "Colombo Fort → Kandy",
      driver: "A. Perera",
      status: "On Time",
      eta: "3 min",
    },
    {
      bus: "NB-1234",
      route: "Route 187",
      routeDesc: "Colombo Fort → Gampaha",
      driver: "S. Silva",
      status: "On Time",
      eta: "9 min",
    },
    {
      bus: "NB-8767",
      route: "Route 99",
      routeDesc: "Colombo Fort → Veyangoda",
      driver: "K. Fernando",
      status: "Delayed",
      eta: "18 min",
    },
    {
      bus: "NA-4488",
      route: "Route 138",
      routeDesc: "Colombo Fort → Negombo",
      driver: "R. Wijewardena",
      status: "On Time",
      eta: "3 min",
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 hover:shadow-lg transition"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg ${item.bg}`}
              >
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>

              {/* Text */}
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h2 className="text-xl font-bold">{item.value}</h2>
              </div>

              {/* Status Badge */}
              <span
                className={`text-xs px-3 py-1 rounded-full w-fit font-semibold ${
                  item.type === "positive"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bus Fleet Section */}
      <div className="bg-white rounded-xl shadow">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Bus Fleet Status</h2>
          <p className="text-sm text-green-600 cursor-pointer hover:underline">
            View All → Weekly Ridership
          </p>
        </div>

        {/* Table */}
        <div className="divide-y">

          {/* Table Header */}
          <div className="grid grid-cols-5 p-4 text-sm font-semibold text-gray-600">
            <div>BUS</div>
            <div>ROUTE</div>
            <div>DRIVER</div>
            <div>STATUS</div>
            <div>ETA</div>
          </div>

          {/* Rows */}
          {busFleetData.map((bus, index) => (
            <div
              key={index}
              className="grid grid-cols-5 p-4 text-sm items-center"
            >
              <div className="font-medium">{bus.bus}</div>

              <div>
                <div className="font-medium">{bus.route}</div>
                <div className="text-xs text-gray-500">
                  {bus.routeDesc}
                </div>
              </div>

              <div>{bus.driver}</div>

              {/* Status */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    bus.status === "On Time"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {bus.status}
                </span>
              </div>

              <div>{bus.eta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}