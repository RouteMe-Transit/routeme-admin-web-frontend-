"use client";

type Props = {
  count: number;
  label?: string;
  className?: string;
  ariaLabel?: string;
};

export default function NotificationCountBadge({
  count,
  label,
  className = "",
  ariaLabel,
}: Props) {
  if (count < 1) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center ${className}`}
      aria-label={ariaLabel || "Notifications"}
    >
      {label && <span className="mr-1">{label}</span>}

      <span
        className="
          inline-flex
          items-center
          justify-center
          min-w-5
          h-5
          px-1.5
          rounded-full
          bg-red-600
          text-white
          text-[11px]
          font-bold
          leading-none
          shadow-[0_2px_10px_rgba(220,38,38,0.35)]
          transition-transform
          duration-200
        "
      >
        {count > 99 ? "99+" : count}
      </span>
    </div>
  );
}
