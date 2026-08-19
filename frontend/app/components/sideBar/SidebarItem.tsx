

"use client";

import NotificationCountBadge from "@/app/passenger/alerts/NotificationCountBadge";

type Props = {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  badgeCount?: number;
};

export default function SidebarItem({
  label,
  icon,
  active,
  onClick,
  badgeCount,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-7 px-6 py-1.5 w-full text-left rounded-md transition
        ${
          active
            ? "text-[#4CAF8A]"
            : "text-gray-300 hover:bg-gray-700"
        }
      `}
    >
      <div className="relative inline-flex items-center justify-center text-2xl">
        {icon}
        <NotificationCountBadge count={badgeCount ?? 0} className="absolute -right-2 -top-2" />
      </div>
      <span className="font-semibold text-xl">{label}</span>
    </button>
  );
}