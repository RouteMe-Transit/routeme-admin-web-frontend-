"use client";

import Link from "next/link";

// ── Static data ───────────────────────────────────────────────────────────────
const busFleetData = [
  {
    bus: "NA-2203",
    route: "Route 120",
    routeDesc: "Colombo Fort → Kandy",
    driver: "Amila Perera",
    status: "On Time",
    eta: "3 min",
  },
  {
    bus: "NB-1234",
    route: "Route 187",
    routeDesc: "Colombo Fort → Gampaha",
    driver: "Saman Silva",
    status: "On Time",
    eta: "9 min",
  },
  {
    bus: "NB-8767",
    route: "Route 99",
    routeDesc: "Colombo Fort → Veyangoda",
    driver: "Kavidu Fernando",
    status: "Delayed",
    eta: "18 min",
  },
  {
    bus: "NA-4488",
    route: "Route 138",
    routeDesc: "Colombo Fort → Negombo",
    driver: "Ravindu Wijewardena",
    status: "On Time",
    eta: "3 min",
  },
  {
    bus: "WP-9876",
    route: "Route 4",
    routeDesc: "Maharagama → Fort",
    driver: "Piyal Dissanayake",
    status: "Breakdown",
    eta: "—",
  },
];

const recentNews = [
  { title: "New Route Introduced to Veyangoda", meta: "New Route · 19/04/2026", live: true },
  { title: "Bus Timings Updated for Kandy Route", meta: "Schedule · 18/04/2026", live: false },
  { title: "Weekend Service Enhancement Announced", meta: "General · 17/04/2026", live: false },
];

const recentComplaints = [
  { title: "NA-2203 was overcrowded", meta: "Passenger · 19/04/2026", pending: true },
  { title: "Driver rude behaviour on Route 187", meta: "Behaviour · 18/04/2026", pending: false },
  { title: "AC not working on NB-8767", meta: "Maintenance · 17/04/2026", pending: false },
];

const STATUS_STYLES: Record<string, string> = {
  "On Time":   "bg-[#61de9f] text-[#00796b]",
  "Delayed":   "bg-yellow-100 text-yellow-700",
  "Breakdown": "bg-red-100 text-red-600",
};

function getNowString() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#122843]">Admin Dashboard</h1>
        <p className="text-sm text-[#94a0ae] mt-0.5">{getNowString()}</p>
      </div>

      {/* ── Stat cards — same layout as ManageBuses / ManageRoutes ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/fleet.png" className="w-12 h-12 object-contain" alt="buses" />
          <div>
            <p className="text-3xl font-extrabold text-black">247</p>
            <p className="text-[#94a0ae] text-sm">Active Buses</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase mt-1 inline-block">
              +12 Today
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/route.png" className="w-10 h-10 object-contain" alt="routes" />
          <div>
            <p className="text-3xl font-extrabold text-black">18</p>
            <p className="text-[#94a0ae] text-sm">Active Routes</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase mt-1 inline-block">
              All Active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/passenger.png" className="w-12 h-12 object-contain" alt="passengers" />
          <div>
            <p className="text-3xl font-extrabold text-black">1,842</p>
            <p className="text-[#94a0ae] text-sm">Passengers Today</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase mt-1 inline-block">
              +8% Today
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/complaintnew.png" className="w-10 h-10 object-contain" alt="complaints" />
          <div>
            <p className="text-3xl font-extrabold text-red-500">14</p>
            <p className="text-[#94a0ae] text-sm">New Complaints</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase mt-1 inline-block">
              Action Needed
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
          <img src="/icons/ontime.png" className="w-14 h-14 object-contain" alt="on-time" />
          <div>
            <p className="text-3xl font-extrabold text-[#00796b]">94%</p>
            <p className="text-[#94a0ae] text-sm">On-Time Rate</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#61de9f] text-[#00796b] uppercase mt-1 inline-block">
              Good
            </span>
          </div>
        </div>

      </div>

      {/* ── Bus Fleet Status table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-[#122843]">Bus Fleet Status</h2>
          <Link href="/admin/fleetMonitor" className="text-sm font-semibold text-[#1d9e75] hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-5 bg-[#f5f8fc] px-5 py-3 text-xs font-extrabold text-gray-600 border-b uppercase tracking-wide">
          <div>Bus</div>
          <div>Route</div>
          <div>Driver</div>
          <div>Status</div>
          <div>ETA</div>
        </div>

        {busFleetData.map((bus, i) => (
          <div
            key={i}
            className="grid grid-cols-5 items-center px-5 py-3 text-sm text-black border-b hover:bg-gray-50 transition last:border-b-0"
          >
            <div className="font-semibold text-[#122843]">{bus.bus}</div>
            <div>
              <div className="font-medium text-gray-700">{bus.route}</div>
              <div className="text-xs text-[#94a0ae]">{bus.routeDesc}</div>
            </div>
            <div className="text-gray-600">{bus.driver}</div>
            <div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[bus.status]}`}>
                {bus.status}
              </span>
            </div>
            <div className="text-gray-600">{bus.eta}</div>
          </div>
        ))}
      </div>

      {/* ── News + Complaints ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#1d9e75]" />
              <h2 className="text-sm font-extrabold text-[#122843]">Recent News</h2>
            </div>
            <Link href="/admin/publishNews" className="text-xs font-semibold text-[#1d9e75] hover:underline">
              Publish New →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNews.map((item, i) => (
              <div key={i} className="flex items-start justify-between px-5 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                  <p className="text-xs text-[#94a0ae] mt-0.5">{item.meta}</p>
                </div>
                {item.live && (
                  <span className="ml-3 flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#61de9f] text-[#00796b] uppercase">
                    Live
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-red-400" />
              <h2 className="text-sm font-extrabold text-[#122843]">Recent Complaints</h2>
            </div>
            <Link href="/admin/complaints" className="text-xs font-semibold text-[#1d9e75] hover:underline">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentComplaints.map((item, i) => (
              <div key={i} className="flex items-start justify-between px-5 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                  <p className="text-xs text-[#94a0ae] mt-0.5">{item.meta}</p>
                </div>
                {item.pending && (
                  <span className="ml-3 flex-shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 uppercase">
                    Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── System Summary — same card style as stat cards ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-extrabold text-[#122843]">System Summary</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {[
            { label: "Fleet Health",   value: "0%",       color: "text-[#00796b]",  icon: "/icons/ontime.png" },
            { label: "Route Coverage", value: "100%",     color: "text-blue-500",   icon: "/icons/route.png"   },
            { label: "Stop Network",   value: "1 Active", color: "text-indigo-500", icon: "/icons/busstop.png"   },
            { label: "Total Users",    value: "7",        color: "text-[#e8b84b]",  icon: "/icons/users.png"   },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-5">
              <img src={icon} className="w-12 h-12 object-contain" alt={label} />
              <div>
                <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                <p className="text-[#94a0ae] text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
