"use client";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  selected?: Date | undefined | null;
  onSelect?: (d?: Date | undefined) => void;
};

export default function CalendarPlaceholder({ selected, onSelect }: Props) {
  const displayMonth = selected
    ? selected.toLocaleString("default", { month: "short", year: "numeric" })
    : "Sep 2025";

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="font-semibold text-lg text-slate-900">Calendar</div>
        <div className="text-sm text-slate-500">{displayMonth}</div>
      </div>

      <div className="border border-slate-200 rounded-[32px] p-3 bg-slate-50">
        <DayPicker
          mode="single"
          selected={selected ?? undefined}
          onSelect={onSelect}
          className="w-full max-w-[280px] mx-auto rounded-3xl bg-white shadow-sm"
          captionLayout="buttons"
          fromYear={2024}
          toYear={2026}
          classNames={{
            months: "block",
            caption: "flex items-center justify-center mb-4",
            caption_label: "text-xl font-semibold text-slate-900",
            nav_button: "text-slate-500 hover:text-slate-800",
            table: "w-full border-separate border-spacing-0 text-sm",
            head_row: "text-slate-500",
            head_cell: "p-2 text-xs font-semibold uppercase tracking-[0.2em] text-center",
            row: "",
            cell: "p-0",
            day: "h-10 w-10 mx-auto my-1 rounded-full hover:bg-slate-100 focus:outline-none",
            day_selected: "bg-slate-900 text-white",
            day_today: "bg-slate-100 text-slate-900",
            day_outside: "text-slate-300",
          }}
          styles={{
            day: { borderRadius: "9999px" },
            nav_button: { minWidth: "2rem" },
          }}
        />
      </div>
    </div>
  );
}
