
"use client";

import { useState } from "react";
import SidebarItem from "./SidebarItem";

import {
  FaMapMarkerAlt,
  FaRoute,
  FaNewspaper,
  FaBell,
  FaSearchLocation,
  FaCommentDots,
  FaTachometerAlt,
  FaBus,
  FaUsers,
  FaExclamationTriangle,
  FaClipboardList,
} from "react-icons/fa";

const menus = {
  passenger: [
    { id: "live", label: "Live Tracking", icon: <FaMapMarkerAlt /> },
    { id: "route", label: "Route Finder", icon: <FaRoute /> },
    { id: "news", label: "News Feed", icon: <FaNewspaper /> },
    { id: "alerts", label: "Alerts", icon: <FaBell /> },
    { id: "lost", label: "Lost & Found", icon: <FaSearchLocation /> },
    { id: "complaints", label: "Complaints", icon: <FaExclamationTriangle /> },
    { id: "feedback", label: "Feedback", icon: <FaCommentDots /> },
  ],

  admin: [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "fleet", label: "Fleet Monitor", icon: <FaBus /> },
    { id: "routes", label: "Manage Routes", icon: <FaRoute /> },
    { id: "buses", label: "Manage Buses", icon: <FaBus /> },
    { id: "news", label: "Publish News", icon: <FaNewspaper /> },
    { id: "alerts", label: "Send Alert", icon: <FaBell /> },
    { id: "users", label: "Users", icon: <FaUsers /> },
    { id: "complaints", label: "Complaints", icon: <FaExclamationTriangle /> },
    { id: "feedback", label: "Feedback", icon: <FaCommentDots /> },
  ],

  driver: [
    { id: "trip", label: "Trip", icon: <FaRoute /> },
    { id: "alerts", label: "Alerts", icon: <FaBell /> },
    { id: "reports", label: "Reports", icon: <FaClipboardList /> },
    { id: "bus", label: "Bus", icon: <FaBus /> },
  ],
};

type Props = {
  role: "passenger" | "admin" | "driver";
};

export default function Sidebar({ role }: Props) {
  const [active, setActive] = useState("");

  const items = menus[role];

  return (
    <div className="w-64 h-screen bg-[#122843] text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 text-2xl font-bold">
        Route<span className="text-green-400">Me</span>
      </div>

      <div className="border-t border-gray-600" />

      {/* Menu */}
      <div className="flex flex-col mt-4 space-y-2 px-2">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={active === item.id}
            onClick={() => setActive(item.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-500 rounded-full" />
          <div>
            <p className="font-semibold">User Name</p>
            <p className="text-sm text-gray-400 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}