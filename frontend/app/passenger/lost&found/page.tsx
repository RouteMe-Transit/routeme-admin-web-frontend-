"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import api from "@/app/services/api";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaBus,
  FaTimes,
  FaPhoneAlt,
  FaEnvelope,
  FaImage,
  FaCheckCircle,
} from "react-icons/fa";

export interface LostFoundUser {
  id: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface LostFoundItem {
  id: number;
  userId?: number | null;
  itemType: "lost" | "found";
  itemName: string;
  busNumber: string;
  date: string;
  time?: string | null;
  location: string;
  description: string;
  image?: string | null;
  status: "open" | "resolved" | "claimed";
  contactPhone?: string | null;
  contactEmail?: string | null;
  createdAt: string;
  user?: LostFoundUser | null;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(
  /\/api\/v1\/?$/,
  ""
);

export function buildImageUrl(path?: string | null): string {
  if (!path) return "/icons/lostFound.png";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "Recent";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function LostFoundPage() {
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [weeklyCount, setWeeklyCount] = useState<number>(0);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    busNumber: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    location: "",
    description: "",
    itemType: "lost" as "lost" | "found",
    contactPhone: "",
    contactEmail: "",
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ── Fetch Items ─────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/lost-found", {
        params: {
          itemType: activeTab,
          search: search.trim() || undefined,
        },
      });

      const data = res.data?.data || res.data;
      setItems(data?.items || []);
    } catch (err: any) {
      console.error("Failed to load lost & found items:", err);
      toast.error(err?.response?.data?.message || "Failed to load items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  // ── Fetch Weekly Stats ──────────────────────────────────────────────────────
  const fetchWeeklyStats = useCallback(async () => {
    try {
      const res = await api.get("/lost-found/stats/weekly");
      const data = res.data?.data || res.data;
      if (typeof data?.weeklyCount === "number") {
        setWeeklyCount(data.weeklyCount);
      }
    } catch (err) {
      console.warn("Could not fetch weekly stats", err);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // ── Form Handlers ───────────────────────────────────────────────────────────
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleOpenReportModal = () => {
    setForm({
      name: "",
      busNumber: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      location: "",
      description: "",
      itemType: activeTab,
      contactPhone: "",
      contactEmail: "",
      image: null,
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter the name of the item");
      return;
    }
    if (!form.busNumber.trim()) {
      toast.error("Please enter the bus number");
      return;
    }
    if (!form.location.trim()) {
      toast.error("Please enter the location");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a short description");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("busNumber", form.busNumber.trim());
      formData.append("date", form.date);
      if (form.time) formData.append("time", form.time);
      formData.append("location", form.location.trim());
      formData.append("description", form.description.trim());
      formData.append("itemType", form.itemType);
      if (form.contactPhone.trim()) formData.append("contactPhone", form.contactPhone.trim());
      if (form.contactEmail.trim()) formData.append("contactEmail", form.contactEmail.trim());
      if (form.image) formData.append("image", form.image);

      await api.post("/lost-found", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`${form.itemType === "lost" ? "Lost" : "Found"} item reported successfully!`);
      setShowModal(false);
      fetchItems();
      fetchWeeklyStats();
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top bar: Tabs + My Items */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("lost")}
              className={`px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 ${
                activeTab === "lost"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Lost Items
            </button>
            <button
              onClick={() => setActiveTab("found")}
              className={`px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 ${
                activeTab === "found"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Found Items
            </button>
          </div>

          <Link href="/passenger/lost&found/myitems">
            <button className="w-full sm:w-auto bg-blue-50 text-blue-700 font-semibold px-6 py-3 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm flex items-center justify-center gap-2">
              <span>📋</span> My Items
            </button>
          </Link>
        </div>

        {/* Search Bar + Report Button */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              placeholder={`Search ${activeTab} items by name, bus #, or location...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 shadow-sm text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenReportModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 font-semibold text-white transition shadow-md shadow-emerald-600/20 sm:w-auto text-sm"
          >
            <FaPlus /> Report Item
          </button>
        </div>

        {/* Weekly Stats */}
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
          <span>{weeklyCount} report{weeklyCount === 1 ? "" : "s"} this week</span>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 animate-pulse gap-4"
              >
                <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 bg-gray-200 rounded-md w-1/3" />
                  <div className="h-3.5 bg-gray-100 rounded-md w-1/4" />
                  <div className="h-3.5 bg-gray-100 rounded-md w-1/2" />
                </div>
                <div className="w-16 h-7 bg-gray-200 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm my-4">
            <img
              src="/icons/lostFound.png"
              alt="No items"
              className="w-20 h-20 mx-auto mb-4 opacity-50 object-contain"
            />
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              No {activeTab === "lost" ? "Lost" : "Found"} Items
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              {search
                ? `No items found matching "${search}". Try adjusting your keywords.`
                : `There are currently no ${activeTab} items reported.`}
            </p>
            <button
              onClick={handleOpenReportModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition shadow-md shadow-blue-500/20"
            >
              <FaPlus /> Report New Item
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item) => {
              const imgUrl = buildImageUrl(item.image);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-gray-100 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icons/lostFound.png";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate group-hover:text-blue-600 transition-colors">
                          {item.itemName}
                        </h3>
                        {item.status === "resolved" && (
                          <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <FaCheckCircle className="text-emerald-500 text-[10px]" /> Resolved
                          </span>
                        )}
                        {item.status === "claimed" && (
                          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <FaCheckCircle className="text-emerald-600 text-[10px]" /> Claimed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-gray-500 mb-1">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <FaBus className="text-blue-500 text-xs" /> Bus {item.busNumber}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-gray-400 text-xs" /> {formatDate(item.date)}
                        </span>
                        {item.time && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <FaClock className="text-gray-400 text-xs" /> {item.time}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-red-400 text-xs shrink-0" />
                        <span className="truncate">{item.location}</span>
                        {item.description && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-400 truncate">{item.description}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        item.itemType === "lost"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-cyan-50 text-cyan-700 border border-cyan-100"
                      }`}
                    >
                      {item.itemType}
                    </span>
                    <button className="text-blue-600 text-xs font-semibold hover:underline hidden sm:block">
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Item Details Modal ──────────────────────────────────────────────── */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedItem(null);
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
              >
                <FaTimes />
              </button>

              {/* Modal Image Header */}
              <div className="relative h-56 w-full bg-slate-900 flex items-center justify-center">
                <img
                  src={buildImageUrl(selectedItem.image)}
                  alt={selectedItem.itemName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/icons/lostFound.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedItem.itemType === "lost"
                          ? "bg-rose-500 text-white"
                          : "bg-cyan-500 text-white"
                      }`}
                    >
                      {selectedItem.itemType} Item
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1.5 truncate">
                      {selectedItem.itemName}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Bus Number</p>
                    <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                      <FaBus className="text-blue-500" /> {selectedItem.busNumber}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Date & Time</p>
                    <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                      <FaCalendarAlt className="text-blue-500 text-xs" />{" "}
                      {formatDate(selectedItem.date)} {selectedItem.time ? `• ${selectedItem.time}` : ""}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-100 text-sm">
                  <p className="text-xs text-gray-400 font-medium">Location</p>
                  <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-rose-500 text-xs shrink-0" /> {selectedItem.location}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedItem.description}
                  </div>
                </div>

                {/* Reporter / Contact Info */}
                {(selectedItem.contactPhone ||
                  selectedItem.contactEmail ||
                  selectedItem.user?.phone ||
                  selectedItem.user?.email) && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                      Contact Information
                    </h4>
                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2 text-sm">
                      {selectedItem.user && (
                        <p className="font-semibold text-gray-800">
                          Reported by: {selectedItem.user.firstName} {selectedItem.user.lastName}
                        </p>
                      )}
                      {(selectedItem.contactPhone || selectedItem.user?.phone) && (
                        <a
                          href={`tel:${selectedItem.contactPhone || selectedItem.user?.phone}`}
                          className="flex items-center gap-2 text-blue-700 hover:underline font-medium"
                        >
                          <FaPhoneAlt className="text-xs" />{" "}
                          {selectedItem.contactPhone || selectedItem.user?.phone}
                        </a>
                      )}
                      {(selectedItem.contactEmail || selectedItem.user?.email) && (
                        <a
                          href={`mailto:${selectedItem.contactEmail || selectedItem.user?.email}`}
                          className="flex items-center gap-2 text-blue-700 hover:underline font-medium"
                        >
                          <FaEnvelope className="text-xs" />{" "}
                          {selectedItem.contactEmail || selectedItem.user?.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-full text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Report Item Modal ──────────────────────────────────────────────── */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) setShowModal(false);
            }}
          >
            <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                disabled={submitting}
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>

              <div className="mb-6">
                <p className="text-xs tracking-[0.2em] text-blue-600 uppercase font-bold mb-1">
                  Report Item
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {form.itemType === "lost" ? "Report a Lost Item" : "Report a Found Item"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Item Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Item Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, itemType: "lost" }))}
                      className={`py-3 rounded-2xl font-bold text-sm border transition ${
                        form.itemType === "lost"
                          ? "bg-rose-50 border-rose-400 text-rose-700 shadow-sm"
                          : "bg-slate-50 border-gray-200 text-gray-600 hover:bg-slate-100"
                      }`}
                    >
                      I Lost Something
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, itemType: "found" }))}
                      className={`py-3 rounded-2xl font-bold text-sm border transition ${
                        form.itemType === "found"
                          ? "bg-cyan-50 border-cyan-400 text-cyan-700 shadow-sm"
                          : "bg-slate-50 border-gray-200 text-gray-600 hover:bg-slate-100"
                      }`}
                    >
                      I Found Something
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Name of the Item *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Black Backpack, iPhone 14"
                      value={form.name}
                      onChange={handleFormChange}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Bus Number *
                    </label>
                    <input
                      type="text"
                      name="busNumber"
                      placeholder="e.g. 12, ND-4521"
                      value={form.busNumber}
                      onChange={handleFormChange}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleFormChange}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Approximate Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleFormChange}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Location / Stop *
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Near Galle Face stop, Back seat row 4"
                    value={form.location}
                    onChange={handleFormChange}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    placeholder="Provide details such as color, brand, unique marks, contents..."
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      placeholder="e.g. +94 77 123 4567"
                      value={form.contactPhone}
                      onChange={handleFormChange}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      placeholder="e.g. name@example.com"
                      value={form.contactEmail}
                      onChange={handleFormChange}
                      className="w-full p-3.5 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>

                {/* Picture Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Picture of the item (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-slate-50 p-4">
                    {imagePreview ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setForm((p) => ({ ...p, image: null }));
                            setImagePreview(null);
                          }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                        <FaImage className="text-2xl" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <label className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-blue-700 transition">
                        Choose File
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {form.image ? form.image.name : "JPEG, PNG or WebP up to 5MB"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="rounded-full border border-gray-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save & Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
