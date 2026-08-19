
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/app/services/api";
import SidebarItem from "./SidebarItem";
import LogoNname from "../logoNname/logoNname";
import { FaBars, FaPowerOff, FaXmark } from "react-icons/fa6";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
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

type MenuSection = {
  id: string;
  label: string;
  items: MenuItem[];
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

type SidebarUser = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
  role?: string;
  image?: string;
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
    // Dashboard and Users are now in the Overview section
  ],

  bus: [
    { id: "trip", label: "Trip", icon: <img src="/icons/trip.png" alt="Trip" className="h-7 w-7 object-contain" />, path: "/bus/trip" },
    { id: "alerts", label: "Alerts", icon: <img src="/icons/alarm.png" alt="Alarm" className="h-7 w-7 object-contain" />, path: "/bus/alerts" },
    { id: "reports", label: "Reports", icon: <img src="/icons/reports.png" alt="Reports" className="h-7 w-7 object-contain" />, path: "/bus/reports" },
    { id: "bus", label: "Bus", icon: <img src="/icons/bus.png" alt="Bus" className="h-7 w-7 object-contain" />, path: "/bus/profile" },
  ],
};

const adminSections: MenuSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <img src="/icons/dashboard.png" alt="Dashboard" className="h-7 w-7 object-contain" />, path: "/admin/dashboard" },
      { id: "users", label: "Users", icon: <img src="/icons/users.png" alt="Users" className="h-7 w-7 object-contain" />, path: "/admin/users" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "fleet", label: "Fleet Monitor", icon: <img src="/icons/map.png" alt="Fleet Monitor" className="h-7 w-7 object-contain" />, path: "/admin/fleetMonitor" },
      { id: "routes", label: "Routes", icon: <img src="/icons/manageRoutes.png" alt="Routes" className="h-7 w-7 object-contain" />, path: "/admin/manageRoutes" },
      { id: "buses", label: "Buses", icon: <img src="/icons/bus.png" alt="Buses" className="h-7 w-7 object-contain" />, path: "/admin/manageBuses" },
      { id: "stops", label: "Stops", icon: <img src="/icons/bus-stops.png" alt="Stops" className="h-7 w-7 object-contain" />, path: "/admin/manageStops" },
      { id: "scheduling", label: "Scheduling", icon: <img src="/icons/trip.png" alt="Scheduling" className="h-7 w-7 object-contain" />, path: "/admin/tripSchedule" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      { id: "alerts", label: "Alerts", icon: <img src="/icons/alarm.png" alt="Alerts" className="h-7 w-7 object-contain" />, path: "/admin/alerts" },
      { id: "news", label: "News", icon: <img src="/icons/newspaper.png" alt="News" className="h-7 w-7 object-contain" />, path: "/admin/publishNews" },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      { id: "complaints", label: "Complaints", icon: <img src="/icons/complaint.png" alt="Complaints" className="h-7 w-7 object-contain" />, path: "/admin/complaints" },
      { id: "feedback", label: "Feedback", icon: <img src="/icons/feedback.png" alt="Feedback" className="h-7 w-7 object-contain" />, path: "/admin/feedback" },
      { id: "reports", label: "Reports", icon: <img src="/icons/reports.png" alt="Reports" className="h-7 w-7 object-contain" />, path: "/admin/reports" },
    ],
  },
];

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
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(null);
  const isGpsEnabled = gpsEnabled ?? localGpsEnabled;

  const loadCurrentUser = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem("user");
      if (!rawValue) {
        setCurrentUser(null);
        return;
      }

      const parsed = JSON.parse(rawValue) as unknown;
      if (!parsed || typeof parsed !== "object") {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(parsed as SidebarUser);
    } catch {
      setCurrentUser(null);
    }
  }, []);

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
      const visibleAlerts = extractAlertList(payload);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    loadCurrentUser();

    const syncCurrentUser = () => {
      loadCurrentUser();
    };

    window.addEventListener("storage", syncCurrentUser);

    return () => {
      window.removeEventListener("storage", syncCurrentUser);
    };
  }, [loadCurrentUser]);

  const items = menus[role] as MenuItem[];

  const renderMenuItem = (item: MenuItem, indented = false) => {
    const isPassengerAlerts = role === "passenger" && item.id === "alerts";

    return (
      <div key={item.id} className={indented ? "pl-5" : ""}>
        <SidebarItem
          label={item.label}
          icon={item.icon}
          active={item.path ? pathname === item.path : false}
          badgeCount={isPassengerAlerts && unreadPassengerAlerts > 0 ? unreadPassengerAlerts : undefined}
          onClick={() => {
            if (item.path) router.push(item.path);
            setMobileMenuOpen(false);
          }}
        />
      </div>
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const userDisplayName =
    currentUser?.displayName?.trim() ||
    currentUser?.name?.trim() ||
    `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() ||
    "Signed in user";

  const userRoleLabel = currentUser?.role?.trim() || role;
  const userImage = currentUser?.image?.trim() || "/default-profile-image.svg";

  return (
    <>
      <button
        type="button"
        aria-label={mobileMenuOpen ? "Close sidebar menu" : "Open sidebar menu"}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-1200 flex h-11 w-11 items-center justify-center rounded-full bg-[#122843] text-white shadow-lg md:hidden"
      >
        {mobileMenuOpen ? <FaXmark className="text-xl" /> : <FaBars className="text-xl" />}
      </button>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-1100 bg-black/50 backdrop-blur-[1px] md:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-1201 flex h-dvh w-70 -translate-x-full flex-col overflow-y-auto bg-[#122843] text-white shadow-2xl transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-20 md:h-dvh md:self-start md:shrink-0 md:w-96.25 md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : ""} ${role === "passenger" ? "passenger-sidebar" : ""} ${role === "bus" ? "bus-sidebar" : ""} ${role === "admin" ? "admin-sidebar" : ""}`}
      >
        <div className="pt-4 pb-4 px-6 md:pt-6">
          <LogoNname />
        </div>

        <div className="border-t border-gray-700" />

        {/* Menu */}
        <div className="flex flex-col mt-3 space-y-2 px-2">
          {role === "admin" ? (
            <>
              {adminSections.map((section) => {
                const isExpanded = expandedSection === section.id;

                return (
                  <div key={section.id} className="space-y-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-6 py-2 text-left rounded-md text-gray-200 hover:bg-gray-700 transition"
                    >
                      <span className="font-semibold text-lg">{section.label}</span>
                      {isExpanded ? (
                        <IoIosArrowUp className="text-xl text-gray-300" />
                      ) : (
                        <IoIosArrowDown className="text-xl text-gray-300" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1">
                        {section.items.map((item) => renderMenuItem(item, true))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            items.map((item) => renderMenuItem(item))
          )}
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
                <img src={userImage} alt="Profile" className="w-10 h-10 rounded-full object-cover mr-4" />
                <div className="text-left">
                  <p className="font-semibold">{userDisplayName}</p>
                  <p className="text-sm text-gray-400 capitalize">{userRoleLabel}</p>
                </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}