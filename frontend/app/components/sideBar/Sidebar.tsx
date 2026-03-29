import React from "react";
import SidebarItem from "./SidebarItem";

import { FaMap, FaRoute, FaBell, FaBoxOpen, FaCommentDots } from "react-icons/fa";
import LogoNname from "../logoNname/logoNname";

export const Sidebar = () => {
  const menuItems = [
    { label: "Live Tracking", icon: <FaMap />, active: true },
    { label: "Route Finder", icon: <FaRoute /> },
    { label: "News Feed", icon: <FaMap /> },
    { label: "Alerts", icon: <FaBell /> },
    { label: "Lost & Found", icon: <FaBoxOpen /> },
    { label: "Feedback", icon: <FaCommentDots /> },
    { label: "Complaint", icon: <FaCommentDots /> },
  ];

  return (
    <div className="h-screen w-72 bg-[#122843] text-white flex flex-col justify-between">
      
      {/* Top */}
      <div>
        {/* Logo */}
        <div>
          <LogoNname />
        </div>

        <div className="border-t border-gray-600" />

        {/* Menu */}
        <div className="mt-4 flex flex-col">
          {menuItems.map((item, index) => (
            <SidebarItem key={index} {...item} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-600 p-4 flex items-center gap-3">
        <img
          src="/profile.png"
          alt="profile"
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold">Kavindra</p>
          <p className="text-sm text-gray-400">Passenger</p>
        </div>
      </div>

    </div>
  );
};