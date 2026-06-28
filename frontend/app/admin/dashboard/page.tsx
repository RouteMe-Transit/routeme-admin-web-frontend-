"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiTruck,
  FiMap,
  FiUsers,
  FiAlertOctagon,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────
type BusStatus = "Active" | "Maintenance" | "Breakdown";

type FleetBus = {
  id: number;
  registrationNumber: string;
  routeName: string;
  routeFromTo: string;
  driverName: string;
  status: BusStatus;
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
  totalPassengers: number;
  newComplaints: number;
  avgRating: number;
  // system summary
  fleetHealth: number;
  resolvedComplaints: number;
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
  Active:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Maintenance: "bg-amber-100  text-amber-700   border border-amber-200",
  Breakdown:   "bg-red-100    text-red-700     border border-red-200",
};

const STATUS_DOT: Record<BusStatus, string> = {
  Active:      "bg-emerald-500",
  Maintenance: "bg-amber-400",
  Breakdown:   "bg-red-500",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon,
  bg,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  bg: string;
  value: string | number;
  label: string;
  color: string;
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

// ─── Star display ─────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const full    = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty   = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {"★".repeat(full)}
      {hasHalf ? "½" : ""}
      {"☆".repeat(Math.max(0, empty))}
    </span>
  );
}

// ─── Default empty stats ──────────────────────────────────────────────────────
const EMPTY_STATS: DashboardStats = {
  activeBuses:        0,
  activeRoutes:       0,
  totalPassengers:    0,
  newComplaints:      0,
  avgRating:          0,
  fleetHealth:        0,
  resolvedComplaints: 0,
  activeStops:        0,
  totalUsers:         0,
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
      const busRes    = await apiFetch<{ total: number; buses: any[] }>("/buses?limit=5");
      const buses     = busRes.buses ?? [];
      const allBusRes = await apiFetch<{ total: number; buses: any[] }>("/buses?limit=500");
      const allBuses  = allBusRes.buses ?? [];
      const activeBuses = allBuses.filter((b: any) => b.status === "Active").length;
      const fleetTotal  = allBuses.length;

      // ── Routes ──
      const routeRes    = await apiFetch<{ total: number; routes: any[] }>("/routes?limit=200");
      const routes      = routeRes.routes ?? [];
      const activeRoutes = routes.filter((r: any) => r.isActive).length;

      // ── Users ──
      const userRes    = await apiFetch<{ total: number; users: any[] }>("/users?limit=500");
      const users      = userRes.users ?? [];
      const passengers = users.filter((u: any) => u.role === "passenger").length;

      // ── Complaints ──
      const cmpRes  = await apiFetch<any>("/complaints");
      const rawCmp  = Array.isArray(cmpRes) ? cmpRes : cmpRes?.complaints ?? [];
      const pending  = rawCmp.filter((c: any) => c.status === "Pending").length;
      const resolved = rawCmp.filter((c: any) => c.status === "Resolved").length;

      // ── Feedbacks — average rating ──
      let avgRating = 0;
      try {
        const fbRes  = await apiFetch<any>("/feedbacks");
        const rawFb  = Array.isArray(fbRes) ? fbRes : fbRes?.feedbacks ?? [];
        if (rawFb.length > 0) {
          const total = rawFb.reduce(
            (sum: number, f: any) => sum + (f.stars ?? f.rating ?? 0),
            0
          );
          avgRating = Math.round((total / rawFb.length) * 10) / 10;
        }
      } catch { /* feedbacks non-critical */ }

      // ── News ──
      const newsRes = await apiFetch<{ news: any[] }>("/news?limit=3");
      const newsArr = newsRes.news ?? [];

      // ── Stops ──
      const stopRes  = await apiFetch<{ total: number; stops: any[] }>("/stops?activeOnly=true&limit=500");
      const activeStopsCount = stopRes.total ?? (stopRes.stops ?? []).length;

      // ── Set stats ──
      setStats({
        activeBuses,
        activeRoutes,
        totalPassengers:    passengers,
        newComplaints:      pending,
        avgRating,
        fleetHealth:        fleetTotal > 0 ? Math.round((activeBuses / fleetTotal) * 100) : 0,
        resolvedComplaints: resolved,
        activeStops:        activeStopsCount,
        totalUsers:         users.length,
      });

      // ── Fleet rows (5 latest buses, real status) ──
      const fleetRows: FleetBus[] = buses.map((b: any) => {
        const route  = routes.find((r: any) => r.id === b.routeId);
        const driver = b.drivers?.[0];
        const busStatus: BusStatus =
          b.status === "Active"      ? "Active"
          : b.status === "Maintenance" ? "Maintenance"
          : "Breakdown";
        return {
          id:                 b.id,
          registrationNumber: b.registrationNumber,
          routeName:          route?.routeName ?? "—",
          routeFromTo:        route ? `${route.from} → ${route.to}` : "—",
          driverName:         driver?.name ?? "—",
          status:             busStatus,
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
          value={(stats.totalPassengers ?? 0).toLocaleString()}
          label="Total Passengers"
          color="text-orange-600"
        />
        <StatCard
          icon={<FiAlertOctagon className="w-5 h-5 text-red-500"    />}
          bg="bg-red-50"
          value={stats.newComplaints}
          label="Pending Complaints"
          color="text-red-600"
        />
        <StatCard
          icon={<FiStar         className="w-5 h-5 text-amber-500"   />}
          bg="bg-amber-50"
          value={stats.avgRating > 0 ? `${stats.avgRating} ★` : "—"}
          label="Avg Feedback Rating"
          color="text-amber-600"
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
            {/* No ETA column */}
            <div className="grid grid-cols-[130px_1fr_1fr_130px] bg-[#f5f8fc] px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <div>Bus</div>
              <div>Route</div>
              <div>Driver</div>
              <div>Status</div>
            </div>

            {loading ? (
              <EmptyRow message="Loading fleet..." />
            ) : fleet.length === 0 ? (
              <EmptyRow message="No buses registered yet." />
            ) : (
              fleet.map((bus) => (
                <div
                  key={bus.id}
                  className="grid grid-cols-[130px_1fr_1fr_130px] items-center px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 transition last:border-b-0"
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

          {/* Fleet Health — % of buses that are Active */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <FiTruck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-orange-600 leading-none">{stats.fleetHealth}%</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Fleet Health</p>
              <p className="text-[9px] text-gray-300 mt-0.5">Active buses</p>
            </div>
          </div>

          {/* Resolved Complaints */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FiCheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-emerald-600 leading-none">{stats.resolvedComplaints}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Resolved Complaints</p>
              <p className="text-[9px] text-gray-300 mt-0.5">All time</p>
            </div>
          </div>

          {/* Active Stops */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FiMap className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-blue-600 leading-none">{stats.activeStops}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Active Stops</p>
              <p className="text-[9px] text-gray-300 mt-0.5">In service</p>
            </div>
          </div>

          {/* Total Users */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <FiUsers className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-violet-600 leading-none">{stats.totalUsers}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Total Users</p>
              <p className="text-[9px] text-gray-300 mt-0.5">All roles</p>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}