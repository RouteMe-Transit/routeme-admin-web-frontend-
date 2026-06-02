"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiTruck,
  FiMap,
  FiUsers,
  FiAlertOctagon,
  FiCheckCircle,
} from "react-icons/fi";
import { IoEye } from "react-icons/io5";

// ─── Types ────────────────────────────────────────────────────────────────────
type BusStatus = "On Time" | "Delayed" | "Breakdown";

type FleetBus = {
  id: number;
  registrationNumber: string;
  routeName: string;
  routeFromTo: string;
  driverName: string;
  status: BusStatus;
  eta: string | null;
};

type NewsItem = {
  id: number;
  title: string;
  category: string;
  publishedDate: string;
  isPublished: boolean;
};

type ComplaintItem = {
  id: string;
  passenger: string;
  category: string;
  bus: string;
  date: string;
  status: "Pending" | "Resolved";
};

type DashboardStats = {
  activeBuses: number;
  activeRoutes: number;
  passengersToday: number;
  newComplaints: number;
  onTimeRate: number;
  fleetHealth: number;
  routeCoverage: number;
  activeStops: number;
  totalUsers: number;
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// ─── Status badge styles ──────────────────────────────────────────────────────
const STATUS_BADGE: Record<BusStatus, string> = {
  "On Time":   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "Delayed":   "bg-amber-100  text-amber-700   border border-amber-200",
  "Breakdown": "bg-red-100    text-red-700     border border-red-200",
};

const STATUS_DOT: Record<BusStatus, string> = {
  "On Time":   "bg-emerald-500",
  "Delayed":   "bg-amber-400",
  "Breakdown": "bg-red-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon,
  bg,
  value,
  label,
  color,
  badge,
  badgeBg,
  badgeColor,
}: {
  icon: React.ReactNode;
  bg: string;
  value: string | number;
  label: string;
  color: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-extrabold tracking-tight leading-none ${color}`}>
          {value}
        </p>
        <p className="text-xs text-gray-500 font-semibold mt-1">{label}</p>
        {badge && (
          <span
            className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  linkLabel,
  onLink,
  children,
  accent = "#4CAF8A",
}: {
  title: string;
  linkLabel?: string;
  onLink?: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[3px] h-[14px] rounded-sm"
            style={{ background: accent }}
          />
          <span className="text-sm font-bold text-[#122843]">{title}</span>
        </div>
        {linkLabel && (
          <button
            onClick={onLink}
            className="text-xs font-semibold hover:opacity-80 transition"
            style={{ color: "#4CAF8A" }}
          >
            {linkLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-gray-400">{message}</div>
  );
}

// ─── Default empty stats ──────────────────────────────────────────────────────
const EMPTY_STATS: DashboardStats = {
  activeBuses:     0,
  activeRoutes:    0,
  passengersToday: 0,
  newComplaints:   0,
  onTimeRate:      0,
  fleetHealth:     0,
  routeCoverage:   0,
  activeStops:     0,
  totalUsers:      0,
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const router = useRouter();

  const [stats,      setStats]      = useState<DashboardStats>(EMPTY_STATS);
  const [fleet,      setFleet]      = useState<FleetBus[]>([]);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── Load all dashboard data ─────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // ── Buses ──
      const busRes  = await apiFetch<{ total: number; buses: any[] }>("/buses?limit=5");
      const buses   = busRes.buses ?? [];
      const activeBuses = buses.filter((b: any) => b.isActive).length;

      // ── Routes ──
      const routeRes   = await apiFetch<{ total: number; routes: any[] }>("/routes?limit=200");
      const routes     = routeRes.routes ?? [];
      const activeRoutes = routes.filter((r: any) => r.isActive).length;

      // ── Users ──
      const userRes    = await apiFetch<{ total: number; users: any[] }>("/users");
      const users      = userRes.users ?? [];
      const passengers = users.filter((u: any) => u.role === "passenger").length;

      // ── Complaints ──
      const cmpRes  = await apiFetch<any>("/complaints");
      const rawCmp  = Array.isArray(cmpRes) ? cmpRes : cmpRes?.complaints ?? [];
      const pending = rawCmp.filter((c: any) => c.status === "Pending").length;
      const resolved = rawCmp.filter((c: any) => c.status === "Resolved").length;
      const totalCmp = rawCmp.length;
      const onTimeRate = totalCmp > 0 ? Math.round((resolved / totalCmp) * 100) : 0;

      // ── News ──
      const newsRes = await apiFetch<{ news: any[] }>("/news?limit=3");
      const newsArr = newsRes.news ?? [];

      // ── Stops ──
      const stopRes  = await apiFetch<{ stops: any[] }>("/stops?activeOnly=true&limit=1");
      const stopList = stopRes.stops ?? [];

      // ── Set stats ──
      setStats({
        activeBuses,
        activeRoutes,
        passengersToday: passengers,
        newComplaints:   pending,
        onTimeRate,
        fleetHealth:     activeBuses > 0 ? Math.round((activeBuses / buses.length) * 100) : 0,
        routeCoverage:   activeRoutes > 0 ? Math.round((activeRoutes / routes.length) * 100) : 0,
        activeStops:     stopList.length,
        totalUsers:      users.length,
      });

      // ── Fleet rows ──
      const fleetRows: FleetBus[] = buses.map((b: any) => {
        const route  = routes.find((r: any) => r.id === b.routeId);
        const driver = b.drivers?.[0];
        return {
          id:                 b.id,
          registrationNumber: b.registrationNumber,
          routeName:          route?.routeName ?? "—",
          routeFromTo:        route ? `${route.from} → ${route.to}` : "—",
          driverName:         driver?.name ?? "—",
          status:             b.isActive ? "On Time" : "Breakdown",
          eta:                null,
        };
      });
      setFleet(fleetRows);

      // ── News ──
      setNews(
        newsArr.map((n: any) => ({
          id:            n.id,
          title:         n.title,
          category:      n.category,
          publishedDate: n.publishedDate ?? n.createdAt ?? "",
          isPublished:   n.isPublished,
        }))
      );

      // ── Complaints (latest 3) ──
      setComplaints(
        rawCmp.slice(0, 3).map((c: any) => ({
          id:        c.id?.toString() ?? "",
          passenger: c.passenger
            ?? (c.user ? `${c.user.firstName ?? ""} ${c.user.lastName ?? ""}`.trim() : "—"),
          category:  c.category ?? "—",
          bus:       c.bus ?? c.busNumber ?? "—",
          date:      c.date ?? (c.createdAt ? fmtDate(c.createdAt) : "—"),
          status:    c.status ?? "Pending",
        }))
      );
    } catch {
      // API unreachable — keep everything at zero/empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <section className="p-6 min-h-screen bg-[#f5f7fa]">

      {/* ── Page heading ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#122843]">Admin Dashboard</h1>
        <p className="text-xs text-gray-400 mt-1">{todayLabel()}</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={<FiTruck        className="w-5 h-5 text-blue-500"    />}
          bg="bg-blue-50"
          value={stats.activeBuses}
          label="Active Buses"
          color="text-blue-600"
        />
        <StatCard
          icon={<FiMap          className="w-5 h-5 text-emerald-500" />}
          bg="bg-emerald-50"
          value={stats.activeRoutes}
          label="Active Routes"
          color="text-emerald-600"
        />
        <StatCard
          icon={<FiUsers        className="w-5 h-5 text-orange-500"  />}
          bg="bg-orange-50"
          value={stats.passengersToday.toLocaleString()}
          label="Passengers Today"
          color="text-orange-600"
        />
        <StatCard
          icon={<FiAlertOctagon className="w-5 h-5 text-red-500"    />}
          bg="bg-red-50"
          value={stats.newComplaints}
          label="New Complaints"
          color="text-red-600"
        />
        <StatCard
          icon={<FiCheckCircle  className="w-5 h-5 text-emerald-500" />}
          bg="bg-emerald-50"
          value={`${stats.onTimeRate}%`}
          label="On-Time Rate"
          color="text-emerald-600"
        />
      </div>

      {/* ── Bus Fleet Status ── */}
      <SectionCard
        title="Bus Fleet Status"
        linkLabel="View All →"
        onLink={() => router.push("/admin/manageBuses")}
      >
        <div className="overflow-x-auto">
          <div className="min-w-max md:min-w-full">
            <div className="grid grid-cols-[120px_1.4fr_1.3fr_110px_80px] bg-[#f5f8fc] px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <div>Bus</div>
              <div>Route</div>
              <div>Driver</div>
              <div>Status</div>
              <div>ETA</div>
            </div>

            {loading ? (
              <EmptyRow message="Loading fleet..." />
            ) : fleet.length === 0 ? (
              <EmptyRow message="No buses registered yet." />
            ) : (
              fleet.map((bus) => (
                <div
                  key={bus.id}
                  className="grid grid-cols-[120px_1.4fr_1.3fr_110px_80px] items-center px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 transition last:border-b-0"
                >
                  <div className="font-bold text-[#122843]">{bus.registrationNumber}</div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{bus.routeName}</div>
                    <div className="text-[10px] text-gray-400">{bus.routeFromTo}</div>
                  </div>
                  <div className="text-gray-600">{bus.driverName}</div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_BADGE[bus.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[bus.status]}`} />
                      {bus.status}
                    </span>
                  </div>
                  <div className="text-gray-500 font-medium">{bus.eta ?? "—"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Recent News + Recent Complaints ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

        {/* Recent News */}
        <SectionCard
          title="Recent News"
          linkLabel="Publish New →"
          onLink={() => router.push("/admin/publishNews")}
          accent="#4CAF8A"
        >
          {loading ? (
            <EmptyRow message="Loading..." />
          ) : news.length === 0 ? (
            <EmptyRow message="No news published yet." />
          ) : (
            news.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {item.category} · {item.publishedDate ? fmtDate(item.publishedDate) : "—"}
                  </p>
                </div>
                {item.isPublished && (
                  <span className="flex-shrink-0 ml-3 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Live
                  </span>
                )}
              </div>
            ))
          )}
        </SectionCard>

        {/* Recent Complaints */}
        <SectionCard
          title="Recent Complaints"
          linkLabel="View All →"
          onLink={() => router.push("/admin/complaints")}
          accent="#f5a623"
        >
          {loading ? (
            <EmptyRow message="Loading..." />
          ) : complaints.length === 0 ? (
            <EmptyRow message="No complaints yet." />
          ) : (
            complaints.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.bus} — {item.category}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {item.passenger} · {item.date}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                  item.status === "Resolved"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-amber-100  text-amber-700  border-amber-200"
                }`}>
                  {item.status}
                </span>
              </div>
            ))
          )}
        </SectionCard>
      </div>

      {/* ── System Summary ── */}
      <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm font-bold text-[#122843] mb-4">System Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <FiTruck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-orange-600 leading-none">{stats.fleetHealth}%</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Fleet Health</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FiMap className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-emerald-600 leading-none">{stats.routeCoverage}%</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Route Coverage</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <IoEye className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-blue-600 leading-none">
                {stats.activeStops > 0 ? `${stats.activeStops} Active` : "0"}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Stop Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <FiUsers className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-violet-600 leading-none">{stats.totalUsers}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Total Users</p>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}