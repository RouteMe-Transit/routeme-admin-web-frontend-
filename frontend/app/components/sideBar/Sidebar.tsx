
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/app/services/api";
import SidebarItem from "./SidebarItem";
import LogoNname from "../logoNname/logoNname";
import { FaPowerOff } from "react-icons/fa6";
import {
  PASSENGER_ALERTS_CHANGED_EVENT,
  getSeenPassengerAlertIds,
} from "@/config/passengerAlerts";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
};

type BackendAlert = {
  id?: string | number;
  _id?: string;
  alertId?: string | number;
  title?: string;
  description?: string;
  type?: string;
  alertType?: string;
  createdAt?: string;
  sentAt?: string;
  timestamp?: string;
  readAt?: string;
  isUnread?: boolean;
  isRead?: boolean;
};

const ALERT_FEED_LIMIT = 50;

function getAuthConfig() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

function extractAlertList(payload: unknown): BackendAlert[] {
  if (Array.isArray(payload)) {
    return payload as BackendAlert[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.alerts)) {
    return record.alerts as BackendAlert[];
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;

    if (Array.isArray(nested.alerts)) {
      return nested.alerts as BackendAlert[];
    }

    if (Array.isArray(nested.data)) {
      return nested.data as BackendAlert[];
    }
  }

  return [];
}

function getAlertId(alert: BackendAlert) {
  return String(alert.id ?? alert._id ?? alert.alertId ?? alert.title ?? alert.timestamp ?? alert.createdAt ?? Date.now());
}

function isAlertUnread(alert: BackendAlert, seenIds: Set<string>) {
  const id = getAlertId(alert);
  const backendUnread = alert.isUnread ?? (typeof alert.isRead === "boolean" ? !alert.isRead : !alert.readAt);

  return Boolean(backendUnread && !seenIds.has(id));
}


const menus = {
  passenger: [
    { id: "live", label: "Live Tracking", icon: <img src="/icons/liveTracking.png" alt="Live Tracking" className="h-7 w-7 object-contain" />, path: "/passenger/liveTracking" },
    { id: "route", label: "Route Finder", icon: <img src="/icons/map.png" alt="Route Finder" className="h-7 w-7 object-contain" />, path: "/passenger/routeFinder" },
    { id: "news", label: "News Feed", icon: <img src="/icons/newspaper.png" alt="News Feed" className="h-7 w-7 object-contain" />, path: "/passenger/newsFeed" },
    { id: "alerts", label: "Alerts", icon: <img src="/icons/alarm.png" alt="Alarm" className="h-7 w-7 object-contain" />, path: "/passenger/alerts" },
    { id: "lost", label: "Lost & Found", icon: <img src="/icons/lostFound.png" alt="Search Location" className="h-7 w-7 object-contain" />, path: "/passenger/lost&found" },
    { id: "complaints", label: "Complaints", icon: <img src="/icons/complaint.png" alt="Complaint" className="h-7 w-7 object-contain" />, path: "/passenger/complaint" },
    { id: "feedback", label: "Feedback", icon: <img src="/icons/feedback.png" alt="Feedback" className="h-7 w-7 object-contain" />, path: "/passenger/feedback" },
  ],

  admin: [
    { id: "dashboard", label: "Dashboard", icon: <img src="/icons/dashboard.png" alt="Dashboard" className="h-7 w-7 object-contain" />, path: "/admin/dashboard" },
    { id: "fleet", label: "Fleet Monitor", icon: <img src="/icons/map.png" alt="Fleet Monitoring" className="h-7 w-7 object-contain" />, path: "/admin/fleetMonitor" },
    { id: "routes", label: "Manage Routes", icon: <img src="/icons/manageRoutes.png" alt="Route" className="h-7 w-7 object-contain" />, path: "/admin/manageRoutes" },
    { id: "buses", label: "Manage Buses", icon: <img src="/icons/bus.png" alt="Bus" className="h-7 w-7 object-contain" />, path: "/admin/manageBuses" },
    { id: "stops", label: "Manage Stops", icon: <img src="/icons/bus-stops.png" alt="Feedback" className="h-7 w-7 object-contain" />, path: "/admin/manageStops" },
    { id: "news", label: "Publish News", icon: <img src="/icons/newspaper.png" alt="News" className="h-7 w-7 object-contain" />, path: "/admin/publishNews" },
    {
      id: "alerts",
      label: "Send Alert",
      icon: <img src="/icons/alarm.png" alt="Alarm" className="h-7 w-7 object-contain" />,
      path: "/admin/alerts",
    },
    { id: "users", label: "Users", icon: <img src="/icons/users.png" alt="Users" className="h-7 w-7 object-contain" />, path: "/admin/users" },
    { id: "reports", label: "Reports", icon: <img src="/icons/reports.png" alt="Reports" className="h-7 w-7 object-contain" />, path: "/admin/reports" },
    { id: "complaints", label: "Complaints", icon: <img src="/icons/complaint.png" alt="Complaint" className="h-7 w-7 object-contain" />, path: "/admin/complaints" },
    { id: "feedback", label: "Feedback", icon: <img src="/icons/feedback.png" alt="Feedback" className="h-7 w-7 object-contain" />, path: "/admin/feedback" },
    
  ],

  bus: [
    { id: "trip", label: "Trip", icon: <img src="/icons/trip.png" alt="Trip" className="h-7 w-7 object-contain" />, path: "/bus/trip" },
    { id: "alerts", label: "Alerts", icon: <img src="/icons/alarm.png" alt="Alarm" className="h-7 w-7 object-contain" />, path: "/bus/alerts" },
    { id: "reports", label: "Reports", icon: <img src="/icons/reports.png" alt="Reports" className="h-7 w-7 object-contain" />, path: "/bus/reports" },
    { id: "bus", label: "Bus", icon: <img src="/icons/bus.png" alt="Bus" className="h-7 w-7 object-contain" />, path: "/bus/profile" },
  ],
};

type Props = {
  role: "passenger" | "admin" | "bus";
  gpsEnabled?: boolean;
  onGpsToggle?: (enabled: boolean) => void;
};

export default function Sidebar({ role, gpsEnabled, onGpsToggle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [localGpsEnabled, setLocalGpsEnabled] = useState(false);
  const [unreadPassengerAlerts, setUnreadPassengerAlerts] = useState(0);
  const isGpsEnabled = gpsEnabled ?? localGpsEnabled;

  const loadUnreadPassengerAlerts = useCallback(async () => {
    if (role !== "passenger") {
      setUnreadPassengerAlerts(0);
      return;
    }

    try {
      const response = await api.get("/alerts/feed", {
        ...getAuthConfig(),
        params: {
          page: 1,
          limit: ALERT_FEED_LIMIT,
        },
      });

      const payload = response.data?.data ?? response.data;
      const seenAlertIds = getSeenPassengerAlertIds();
      const alerts = extractAlertList(payload);

      // Determine user registration time (if available) from stored user object.
      function getUserRegisteredAt(): Date | null {
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          if (!raw) return null;
          const user = JSON.parse(raw) as Record<string, unknown>;

          const candidates = [
            "createdAt",
            "created_at",
            "registeredAt",
            "registered_at",
            "joinedAt",
            "joined_at",
            "created",
            "registeredOn",
          ];

          for (const k of candidates) {
            const v = user[k];
            if (typeof v === "string") {
              const d = Date.parse(v);
              if (!Number.isNaN(d)) return new Date(d);
            }
          }
        } catch {
          // ignore
        }

        return null;
      }

      function parseAlertCreatedAt(a: BackendAlert): Date | null {
        const val = a.sentAt ?? a.createdAt ?? a.timestamp;
        if (!val) return null;
        const parsed = Date.parse(String(val));
        return Number.isNaN(parsed) ? null : new Date(parsed);
      }

      const userRegisteredAt = getUserRegisteredAt();

      const visibleAlerts = alerts.filter((a) => {
        if (!userRegisteredAt) return true;
        const ad = parseAlertCreatedAt(a);
        return ad !== null && ad >= userRegisteredAt;
      });

      const unreadCount = visibleAlerts.filter((alert) => isAlertUnread(alert, seenAlertIds)).length;
      setUnreadPassengerAlerts(unreadCount);
    } catch {
      setUnreadPassengerAlerts(0);
    }
  }, [role]);

  useEffect(() => {
    if (role !== "passenger") {
      setUnreadPassengerAlerts(0);
      return;
    }

    void loadUnreadPassengerAlerts();

    const updateUnreadCount = () => {
      void loadUnreadPassengerAlerts();
    };

    window.addEventListener(PASSENGER_ALERTS_CHANGED_EVENT, updateUnreadCount);

    return () => {
      window.removeEventListener(PASSENGER_ALERTS_CHANGED_EVENT, updateUnreadCount);
    };
  }, [loadUnreadPassengerAlerts, role, pathname]);

  const items = menus[role] as MenuItem[];

  return (
    <div
      className={`h-screen bg-[#122843] text-white flex flex-col sticky top-0 z-20 ${role === "passenger" ? "passenger-sidebar" : ""} ${role === "bus" ? "bus-sidebar" : ""} ${role === "admin" ? "admin-sidebar" : ""}`}
      style={{ width: "385px" }}
    >
      <LogoNname/>

      <div className="border-t border-gray-700" />

        {/* Menu */}
        <div className="flex flex-col mt-3 space-y-2 px-2">
          {items.map((item) => {
            const isPassengerAlerts = role === "passenger" && item.id === "alerts";

            return (
              <SidebarItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={item.path ? pathname === item.path : false}
                badgeCount={isPassengerAlerts && unreadPassengerAlerts > 0 ? unreadPassengerAlerts : undefined}
                onClick={() => {
                  if (item.path) router.push(item.path);
                }}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto p-2 border-t border-gray-600">
          {role === "bus" ? (
            <button
              onClick={() => {
                const nextValue = !isGpsEnabled;
                setLocalGpsEnabled(nextValue);
                onGpsToggle?.(nextValue);
              }}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md font-semibold transition ${
                isGpsEnabled
                  ? "bg-[#4CAF8A] text-white"
                  : "text-gray-300 hover:bg-gray-600 border border-white"
              }`}
            >
              <FaPowerOff className="text-lg" />
              {isGpsEnabled ? "GPS ON" : "GPS OFF"}
            </button>
          ) : (
            <button
                onClick={() => {
                  if (role === "passenger") router.push("/passenger/profile");
                  else if (role === "admin") router.push("/admin/profile");
                }}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 transition"
              >
                <img src="/default-profile-image.svg" alt="Profile" className="w-10 h-10 rounded-full object-cover mr-4" />
                <div className="text-left">
                  <p className="font-semibold">User Name</p>
                  <p className="text-sm text-gray-400 capitalize">{role}</p>
                </div>
            </button>
          )}
        </div>
    </div>
  );
}