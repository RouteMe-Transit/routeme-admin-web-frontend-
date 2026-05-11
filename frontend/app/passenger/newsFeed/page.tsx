"use client";

import { useState } from "react";
import Image from "next/image";

const CATEGORY_STYLES: Record<string, string> = {
  "Service Update": "bg-blue-500 text-white",
  "Route Change":   "bg-orange-500 text-white",
  "New Route":      "bg-green-500 text-white",
  "Maintenance":    "bg-yellow-500 text-white",
  "General":        "bg-gray-500 text-white",
  "Emergency":      "bg-red-500 text-white",
  "Schedule":       "bg-purple-500 text-white",
};

const newsData = [
  {
    id: 1,
    title: "New Express Route Colombo - Veyangoda Launched",
    category: "New Route",
    content: "A new express bus service has been introduced connecting Colombo Fort to Veyangoda. Bus No. 267 will operate this route with limited stops for faster travel. The service runs daily from 6:00 AM to 9:00 PM with departures every 45 minutes.",
    date: "March 3, 2026",
    image: "/icons/news1.png",
  },
  {
    id: 2,
    title: "Updated Weekend Time Table for All Routes",
    category: "Schedule",
    content: "The weekend timetable has been updated for all major routes effective from April 1, 2026. Buses will now operate at 30-minute intervals during peak hours on Saturdays and Sundays. Please check the app for updated schedules.",
    date: "March 3, 2026",
    image: "/icons/news2.png",
  },
  {
    id: 3,
    title: "Route 154 Extended to Moratuwa from February 1",
    category: "Route Change",
    content: "Route 154 has been extended to cover Moratuwa from February 1, 2026. Passengers travelling to Moratuwa can now board Route 154 directly from Colombo Fort without changing buses. Additional stops have been added at Dehiwala and Mount Lavinia.",
    date: "March 3, 2026",
    image: "/icons/news3.png",
  },
  {
    id: 4,
    title: "Lost & Found Office Now Available at Colombo Fort Terminal",
    category: "Service Update",
    content: "A dedicated Lost & Found office has been opened at the Colombo Fort Bus Terminal. Passengers who have lost items on any RouteMe bus can now report and collect their belongings at the terminal office. Operating hours are 8:00 AM to 6:00 PM daily.",
    date: "March 5, 2026",
    image: "/icons/news4.png",
  },
  {
    id: 5,
    title: "Maintenance Work on Route 99 Buses This Weekend",
    category: "Maintenance",
    content: "Scheduled maintenance work will be carried out on Route 99 buses this weekend. Passengers may experience slight delays. We apologize for any inconvenience caused and thank you for your patience.",
    date: "April 10, 2026",
    image: "/icons/news5.png",
  },
  {
    id: 6,
    title: "Emergency Service Disruption on Route 120",
    category: "Emergency",
    content: "Due to road construction near Kandy Road, Route 120 will be temporarily diverted. The diversion will be in effect from April 15 to April 20, 2026. Please allow extra travel time during this period.",
    date: "April 15, 2026",
    image: "/icons/news6.png",
  },
];

const categories = [
  "All",
  "Service Update",
  "Route Change",
  "New Route",
  "Maintenance",
  "General",
  "Emergency",
  "Schedule",
];

type NewsItem = typeof newsData[0];

// ── Single Card ───────────────────────────────────────────────────────────────
function NewsCard({
  item,
  onClick,
}: {
  item:    NewsItem;
  onClick: () => void;
}) {
  const badgeClass =
    CATEGORY_STYLES[item.category] || "bg-gray-500 text-white";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
    >
      {/* Image */}
      <div className="relative w-full h-[150px] bg-gray-200">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={
              "text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-md " +
              badgeClass
            }
          >
            {item.category}
          </span>
        </div>
      </div>

      {/* Text content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">
          {item.title}
        </h3>
        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
          {item.content}
        </p>

        {/* Avatar + date */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-4 h-4 rounded-full bg-[#122843] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[7px] font-black">R</span>
          </div>
          <span className="text-[10px] text-gray-400">{item.date}</span>
        </div>
      </div>
    </div>
  );
}

// ── Article Modal ─────────────────────────────────────────────────────────────
function ArticleModal({
  item,
  onClose,
}: {
  item:    NewsItem;
  onClose: () => void;
}) {
  const badgeClass =
    CATEGORY_STYLES[item.category] || "bg-gray-500 text-white";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Image */}
        <div className="relative w-full h-[220px] bg-gray-200 flex-shrink-0">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover rounded-t-3xl sm:rounded-t-2xl"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-t-3xl sm:rounded-t-2xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white font-bold text-sm transition"
          >
            ✕
          </button>

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span
              className={
                "text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-md " +
                badgeClass
              }
            >
              {item.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <h2 className="text-base font-extrabold text-gray-900 leading-snug">
            {item.title}
          </h2>

          {/* Date row */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#122843] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-black">R</span>
            </div>
            <span className="text-xs text-gray-400">{item.date}</span>
            <span className="text-xs text-gray-300">· RouteMe</span>
          </div>

          <div className="h-px bg-gray-100" />

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {item.content}
          </p>

          {/* Close button bottom */}
          <button
            onClick={onClose}
            className="w-full mt-2 py-3 bg-[#122843] text-white rounded-xl font-semibold text-sm hover:bg-[#1a3a5c] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function PassengerNewsFeed() {
  const [search,          setSearch]          = useState("");
  const [activeCategory,  setActiveCategory]  = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  const filtered = newsData.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === "All" || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="px-4 py-5 max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#122843] flex items-center justify-center">
            <span className="text-base">📰</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#122843]">News Feed</h1>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#122843]/20 shadow-sm"
          />
        </div>

        {/* CATEGORY FILTER */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition " +
                (activeCategory === cat
                  ? "bg-[#122843] text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300")
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-gray-400 font-medium text-sm">No news found</p>
            <p className="text-gray-300 text-xs">
              Try a different search or category
            </p>
          </div>
        )}

        {/* NEWS GRID — 2 columns matching Figma */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onClick={() => setSelectedArticle(item)}
              />
            ))}
          </div>
        )}

      </div>

      {/* ARTICLE DETAIL MODAL */}
      {selectedArticle && (
        <ArticleModal
          item={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
