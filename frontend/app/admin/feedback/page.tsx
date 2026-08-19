"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/app/services/api";
import { IoEye, IoSearch } from "react-icons/io5";
import { FiMessageCircle, FiStar, FiClock } from "react-icons/fi";

type TimeFilter = "all" | "today" | "month";

type Feedback = {
  id: string;
  displayId?: string;
  name: string;
  bus: string;
  category: string;
  comment: string;
  stars: number;
  date: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  busNumber?: string;
  message?: string;
  createdAt?: string;
};

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function formatFeedbackId(rawId: string, prefix = "FB", width = 4): string {
    const text = String(rawId).trim();
    const digits = text.match(/(\d+)$/)?.[1] ?? text.replace(/\D/g, "");
    return digits ? `${prefix}${digits.padStart(width, "0")}` : text;
  }

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const getAuthConfig = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  };

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params: any = { page: 1, limit: 50 };
        if (starFilter !== "all") params.rating = starFilter;
        if (search) params.search = search;

        const config = { params, ...(getAuthConfig() as any) };
        const response = await api.get("/feedbacks", config);
        const rawData = response.data?.data || response.data;
        const feedbacksArray = Array.isArray(rawData) ? rawData : rawData?.feedbacks ?? [];
        const normalized = feedbacksArray.map((item: any) => ({
          id: item.id?.toString() || "",
          displayId: formatFeedbackId(item.id?.toString() || ""),
          name:
            item.user?.firstName && item.user?.lastName
              ? `${item.user.firstName} ${item.user.lastName}`
              : item.user?.email || "Unknown User",
          bus: item.bus || item.busNumber || "",
          category: item.category || "",
          comment: item.comment || item.message || "",
          stars: item.stars || item.rating || 0,
          date: item.date || new Date(item.createdAt).toISOString().split("T")[0],
          user: item.user,
          busNumber: item.busNumber,
          message: item.message,
          createdAt: item.createdAt,
        }));
        setFeedbacks(normalized);
      } catch (err: any) {
        console.error("Error loading feedbacks:", err);
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
        toast.error("Unable to load feedbacks. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    const t = setTimeout(fetchFeedbacks, 350);
    return () => clearTimeout(t);
  }, []);

  // Apply only client-side time filter; search and rating handled by server
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "today" && fb.date === today) ||
      (timeFilter === "month" && fb.date.startsWith(currentMonth));
    return matchesTime;
  });

  const stats = [
    {
      title: "Filtered Feedback",
      value: filteredFeedbacks.length,
      icon: <FiMessageCircle className="h-6 w-6 text-blue-500" />,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Average Rating",
      value: feedbacks.length ? (feedbacks.reduce((sum, item) => sum + item.stars, 0) / feedbacks.length).toFixed(1) : "0.0",
      icon: <FiStar className="h-6 w-6 text-amber-500" />,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      title: "This Month",
      value: feedbacks.filter((item) => item.date.startsWith(currentMonth)).length,
      icon: <FiClock className="h-6 w-6 text-emerald-500" />,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
  ];

  const renderStars = (count: number) => "★".repeat(count);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 md:p-6">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <div>
              <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
              <p className="text-sm font-semibold text-gray-400">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex w-full items-center gap-2 rounded-lg border border-[#828282]/40 bg-white px-3 py-2 shadow-sm md:w-80">
          <IoSearch className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <select
          className="h-10 w-full sm:w-auto cursor-pointer rounded-lg border border-[#828282]/40 bg-white px-3 text-sm shadow-sm"
          value={starFilter}
          onChange={(e) =>
            setStarFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
        >
          <option value="all">All Ratings</option>
          <option value="5">★★★★★</option>
          <option value="4">★★★★</option>
          <option value="3">★★★</option>
          <option value="2">★★</option>
          <option value="1">★</option>
        </select>

        <select
          className="h-10 w-full sm:w-auto cursor-pointer rounded-lg border border-[#828282]/40 bg-white px-3 text-sm shadow-sm"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm font-semibold text-gray-500 shadow-sm">
          Loading feedbacks...
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm font-semibold text-gray-400 shadow-sm">
          No feedback found.
        </div>
      ) : (
        <>
          {/* ── MOBILE: stacked cards (below md) ───────────────────────────── */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      {fb.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold tracking-wider text-gray-400">
                        {fb.displayId ?? fb.id}
                      </p>
                      <p className="truncate font-semibold text-gray-800">{fb.name}</p>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-amber-500 text-sm">
                    {renderStars(fb.stars)}
                  </span>
                </div>

                <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span><b className="text-gray-500">Category:</b> {fb.category || "—"}</span>
                  <span><b className="text-gray-500">Bus:</b> {fb.bus || "—"}</span>
                  <span className="font-mono"><b className="text-gray-500 font-sans">Date:</b> {fb.date}</span>
                </div>

                <p className="mb-3 line-clamp-2 text-sm text-gray-700">{fb.comment}</p>

                <button
                  onClick={() => setSelectedFeedback(fb)}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold shadow-sm transition hover:bg-blue-100"
                >
                  <IoEye className="h-4 w-4" />
                  View Feedback
                </button>
              </div>
            ))}
          </div>

          {/* ── DESKTOP: table (md and up) ─────────────────────────────────── */}
          <div className="hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[70px_1.5fr_1fr_1fr_2fr_70px_80px_60px] border-b bg-[#f8fafc] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500">
                <div>ID</div>
                <div>Name</div>
                <div>Category</div>
                <div>Bus</div>
                <div>Comment</div>
                <div>Rating</div>
                <div>Date</div>
                <div className="text-center">Action</div>
              </div>

              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="grid grid-cols-[70px_1.5fr_1fr_1fr_2fr_70px_80px_60px] items-center border-b px-5 py-3.5 text-sm transition-colors hover:bg-blue-50/30"
                >
                  <div className="font-mono text-xs font-bold tracking-wider text-gray-400 whitespace-nowrap">{fb.displayId ?? fb.id}</div>

                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      {fb.name.charAt(0)}
                    </div>
                    <div className="min-w-0 truncate font-semibold text-gray-800">{fb.name}</div>
                  </div>

                  <div className="min-w-0 truncate text-gray-700">{fb.category}</div>
                  <div className="min-w-0 truncate text-gray-700">{fb.bus}</div>
                  <div className="min-w-0 truncate text-gray-600 text-sm">{fb.comment}</div>
                  <div className="whitespace-nowrap text-amber-500 text-sm">{renderStars(fb.stars)}</div>
                  <div className="font-mono text-xs text-gray-500 whitespace-nowrap">{fb.date}</div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => setSelectedFeedback(fb)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-100"
                      title="View feedback"
                    >
                      <IoEye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 md:p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Feedback Details</h2>

            <p><b>ID:</b> {selectedFeedback.displayId ?? selectedFeedback.id}</p>
            <p><b>Name:</b> {selectedFeedback.name}</p>
            <p><b>Bus:</b> {selectedFeedback.bus}</p>
            <p><b>Category:</b> {selectedFeedback.category}</p>
            <p><b>Date:</b> {selectedFeedback.date}</p>
            <p><b>Rating:</b> {renderStars(selectedFeedback.stars)}</p>

            <div className="mt-2">
              <b>Comment:</b>
              <div className="mt-2 bg-gray-100 p-3 rounded max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-gray-700">
                {selectedFeedback.comment}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}