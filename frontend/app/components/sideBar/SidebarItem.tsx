

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
      <div className="text-2xl">{icon}</div>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-xl">{label}</span>
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {badgeCount}
          </span>
        )}
      </div>
    </button>
  );
}