"use client";

import { useEffect, useState } from "react";
import api from "@/app/services/api";

type TimeFilter = "all" | "today" | "month";

type Feedback = {
  id: string;
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
        const config = getAuthConfig();
        const response = await api.get("/feedbacks", config);
        const rawData = response.data?.data || response.data;
        const feedbacksArray = Array.isArray(rawData) ? rawData : rawData?.feedbacks ?? [];
        const normalized = feedbacksArray.map((item: any) => ({
          id: item.id?.toString() || "",
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
        setError("Unable to load feedbacks. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // FILTER LOGIC
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesStars = starFilter === "all" || fb.stars === starFilter;

    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "today" && fb.date === today) ||
      (timeFilter === "month" && fb.date.startsWith(currentMonth));

    const matchesSearch =
      fb.name.toLowerCase().includes(search.toLowerCase()) ||
      fb.comment.toLowerCase().includes(search.toLowerCase()) ||
      fb.bus.toLowerCase().includes(search.toLowerCase());

    return matchesStars && matchesTime && matchesSearch;
  });

  const renderStars = (count: number) => "★".repeat(count);

  return (
    <div className="min-h-screen p-8">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* TOP FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border">
          <div className="text-3xl">😊</div>
          <div>
            <p className="text-2xl font-bold">{filteredFeedbacks.length}</p>
            <p className="text-sm text-gray-500">Filtered Feedback</p>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback..."
          className="px-4 py-2 border rounded-xl w-64"
        />

        <select
          className="px-4 py-2 border rounded-xl"
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
          className="px-4 py-2 border rounded-xl"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        {/* HEADER (FIXED ALIGNMENT) */}
        <div className="grid grid-cols-8 bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-600 border-b uppercase tracking-wide">
          <div className="col-span-2">Name</div>
          <div>Bus</div>
          <div>Category</div>
          <div>Comment</div>
          <div>Rating</div>
          <div>Date</div>
          <div>Action</div>
        </div>

        {/* ROWS */}
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading feedbacks...</div>
        ) : (
          filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className="grid grid-cols-8 items-center p-4 border-b hover:bg-gray-50"
            >
              {/* NAME (WIDER SPACE FIX) */}
              <div className="col-span-2 flex items-center gap-3">
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                  {fb.name.charAt(0)}
                </div>
                {fb.name}
              </div>

              <div>{fb.bus}</div>
              <div>{fb.category}</div>
              <div className="truncate">{fb.comment}</div>
              <div className="text-yellow-500">{renderStars(fb.stars)}</div>
              <div>{fb.date}</div>

              {/* VIEW BUTTON */}
              <div>
                <button
                  onClick={() => setSelectedFeedback(fb)}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[420px] shadow-lg">
            <h2 className="text-lg font-bold mb-4">Feedback Details</h2>

            <p><b>Name:</b> {selectedFeedback.name}</p>
            <p><b>Bus:</b> {selectedFeedback.bus}</p>
            <p><b>Category:</b> {selectedFeedback.category}</p>
            <p><b>Date:</b> {selectedFeedback.date}</p>
            <p><b>Rating:</b> {renderStars(selectedFeedback.stars)}</p>

            <p className="mt-2"><b>Comment:</b></p>
            <p className="text-gray-600">{selectedFeedback.comment}</p>

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