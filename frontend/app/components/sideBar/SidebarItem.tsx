

type Props = {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export default function SidebarItem({
  label,
  icon,
  active,
  onClick,
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
      <span className="font-semibold text-xl">{label}</span>
    </button>
  );
}