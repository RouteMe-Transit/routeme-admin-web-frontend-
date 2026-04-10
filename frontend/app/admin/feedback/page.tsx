"use client";

import { useState } from "react";

type TimeFilter = "all" | "today" | "month";

export default function AdminFeedback() {
  const feedbacks = [
    { id: 1, name: "K.Jayawardane", bus: "Bus 12", category: "Punctuality", comment: "The bus arrived exactly on time...", stars: 5, date: "2026-04-01" },
    { id: 2, name: "M.L.Anusha", bus: "Bus 88", category: "Driver Behavior", comment: "The driver was over speeding...", stars: 3, date: "2026-04-02" },
    { id: 3, name: "B.Ranawaka", bus: "Bus 59", category: "Cleanliness", comment: "Bus was mostly clean...", stars: 4, date: "2026-03-20" },
    { id: 4, name: "W.Samarakoon", bus: "Bus 15", category: "Overall", comment: "Excellent service...", stars: 5, date: "2026-04-03" },
    { id: 5, name: "K.Minesh", bus: "Bus 33", category: "Safety", comment: "The bus was slightly overcrowded.", stars: 3, date: "2026-03-28" },
    { id: 6, name: "S.K.Perera", bus: "Bus 45", category: "Punctuality", comment: "The bus was 25 minutes late...", stars: 2, date: "2026-04-01" },
  ];

  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesStars = starFilter === "all" || fb.stars === starFilter;

    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "today" && fb.date === today) ||
      (timeFilter === "month" && fb.date.startsWith(currentMonth));

    return matchesStars && matchesTime;
  });

  const renderStars = (count: number) => "\u2605".repeat(count);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex w-80 items-center gap-6 rounded-2xl border bg-white p-6 shadow-md transition hover:shadow-lg">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-yellow-50">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="#FFD93B" />
              <circle cx="22" cy="26" r="3" fill="#333" />
              <circle cx="42" cy="26" r="3" fill="#333" />
              <path d="M20 40 Q32 50 44 40" stroke="#333" strokeWidth="3" fill="none" />
            </svg>
          </div>

          <div>
            <p className="text-4xl font-extrabold text-slate-800">{filteredFeedbacks.length}</p>
            <p className="text-sm text-slate-500">Filtered Feedback</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            className="rounded-md border p-2"
            value={starFilter}
            onChange={(e) =>
              setStarFilter(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">All Ratings</option>
            <option value="5">{"\u2605"} 5 Stars</option>
            <option value="4">{"\u2605"} 4 Stars</option>
            <option value="3">{"\u2605"} 3 Stars</option>
            <option value="2">{"\u2605"} 2 Stars</option>
            <option value="1">{"\u2605"} 1 Star</option>
          </select>

          <select
            className="rounded-md border p-2"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="grid grid-cols-6 bg-gray-100 p-4 text-sm font-semibold">
          <div>Name</div>
          <div>Bus</div>
          <div>Category</div>
          <div>Comment</div>
          <div>Rating</div>
          <div>Date</div>
        </div>

        {filteredFeedbacks.map((fb) => {
          const initial = fb.name.charAt(0).toUpperCase();

          return (
            <div key={fb.id} className="grid grid-cols-6 items-center p-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                  {initial}
                </div>
                {fb.name}
              </div>

              <div>{fb.bus}</div>
              <div>{fb.category}</div>
              <div>{fb.comment}</div>
              <div>{renderStars(fb.stars)}</div>
              <div>{fb.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
