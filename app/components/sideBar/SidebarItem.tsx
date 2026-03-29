import React from "react";

interface Props {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
}

const SidebarItem = ({ label, icon, active, badge }: Props) => {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#1a3a5a] ${
        active ? "bg-[#1a3a5a] text-[#50b18d]" : "text-gray-300"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-lg">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>

      {badge && (
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
};

export default SidebarItem;