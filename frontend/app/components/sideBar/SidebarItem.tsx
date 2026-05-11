

"use client";

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
      <div className="text-2xl relative inline-block">
        {icon}
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white animate-pulse">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      <span className="font-semibold text-xl">{label}</span>
    </button>
  );
}