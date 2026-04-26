
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SidebarItem from "./SidebarItem";
import LogoNname from "../logoNname/logoNname";
import { FaPowerOff } from "react-icons/fa6";
import {
  PASSENGER_ALERTS_CHANGED_EVENT,
  getPassengerUnreadAlertCount,
} from "@/config/passengerAlerts";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
};


const menus = {
  passenger: [
    { id: "live", label: "Live Tracking", icon: <img src="/icons/liveTracking.png" alt="Live Tracking" className="h-7 w-7 object-contain" />, path: "/passenger/liveTracking" },
    { id: "route", label: "Route Finder", icon: <img src="/icons/map.png" alt="Route Finder" className="h-7 w-7 object-contain" />, path: "/passenger/routeFinder" },
    { id: "news", label: "News Feed", icon: <img src="/icons/NewsPaper.png" alt="News Feed" className="h-7 w-7 object-contain" />, path: "/passenger/newsFeed" },
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
  const [unreadPassengerAlerts, setUnreadPassengerAlerts] = useState(() =>
    role === "passenger" ? getPassengerUnreadAlertCount() : 0,
  );
  const isGpsEnabled = gpsEnabled ?? localGpsEnabled;

  useEffect(() => {
    if (role !== "passenger") {
      return;
    }

    const updateUnreadCount = () => {
      setUnreadPassengerAlerts(getPassengerUnreadAlertCount());
    };

    updateUnreadCount();
    window.addEventListener(PASSENGER_ALERTS_CHANGED_EVENT, updateUnreadCount);

    return () => {
      window.removeEventListener(PASSENGER_ALERTS_CHANGED_EVENT, updateUnreadCount);
    };
  }, [role]);

  const items = menus[role] as MenuItem[];

  return (
    <div className={`w-[385px] h-screen bg-[#122843] text-white flex flex-col sticky top-0 z-20 ${role === "passenger" ? "passenger-sidebar" : ""} ${role === "bus" ? "bus-sidebar" : ""} ${role === "admin" ? "admin-sidebar" : ""}`}>
      <LogoNname/>

      <div className="border-t border-gray-700" />

        {/* Menu */}
        <div className="flex flex-col mt-3 space-y-2 px-2">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={item.path ? pathname === item.path : false}
              badgeCount={role === "passenger" && item.id === "alerts" && unreadPassengerAlerts > 0 ? unreadPassengerAlerts : undefined}
              onClick={() => {
                if (item.path) router.push(item.path);
              }}
            />
          ))}
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
                <img src="/profile-placeholder.png" alt="Profile" className="w-10 h-10 rounded-full object-cover mr-4" />
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