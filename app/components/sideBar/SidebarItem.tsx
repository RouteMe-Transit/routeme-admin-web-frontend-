

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
      className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-md transition
        ${
          active
            ? "bg-green-600 text-white"
            : "text-gray-300 hover:bg-gray-700"
        }
      `}
    >
      <div className="text-xl">{icon}</div>
      <span className="font-semibold text-lg">{label}</span>
    </button>
  );
}