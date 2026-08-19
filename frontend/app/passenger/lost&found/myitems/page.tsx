"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import api from "@/app/services/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaPlus,
  FaPencilAlt,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaBus,
  FaMapMarkerAlt,
  FaImage,
  FaTimes,
  FaBoxOpen,
} from "react-icons/fa";
import { LostFoundItem, buildImageUrl, formatDate } from "../page";

export default function MyItemsPage() {
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<LostFoundItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    busNumber: "",
    date: "",
    time: "",
    location: "",
    description: "",
    itemType: "lost" as "lost" | "found",
    status: "open" as "open" | "resolved" | "claimed",
    contactPhone: "",
    contactEmail: "",
    image: null as File | null,
  });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Fetch User's Items ──────────────────────────────────────────────────────
  const fetchMyItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/lost-found/my-items", {
        params: {
          itemType: activeTab,
        },
      });

      const data = res.data?.data || res.data;
      setItems(data?.items || []);
    } catch (err: any) {
      console.error("Failed to load user items:", err);
      // If 401, user is unauthenticated
      if (err?.response?.status === 401) {
        toast.error("Please sign in to view your reported items");
      } else {
        toast.error(err?.response?.data?.message || "Failed to load your items");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMyItems();
  }, [fetchMyItems]);

  // ── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (item: LostFoundItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.itemName,
      busNumber: item.busNumber,
      date: item.date ? item.date.split("T")[0] : "",
      time: item.time || "",
      location: item.location,
      description: item.description,
      itemType: item.itemType,
      status: item.status,
      contactPhone: item.contactPhone || "",
      contactEmail: item.contactEmail || "",
      image: null,
    });
    setEditImagePreview(item.image ? buildImageUrl(item.image) : null);
  };

  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEditForm((prev) => ({ ...prev, image: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Submit Edit ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSavingEdit(true);
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("busNumber", editForm.busNumber.trim());
      formData.append("date", editForm.date);
      if (editForm.time) formData.append("time", editForm.time);
      formData.append("location", editForm.location.trim());
      formData.append("description", editForm.description.trim());
      formData.append("itemType", editForm.itemType);
      formData.append("status", editForm.status);
      if (editForm.contactPhone) formData.append("contactPhone", editForm.contactPhone.trim());
      if (editForm.contactEmail) formData.append("contactEmail", editForm.contactEmail.trim());
      if (editForm.image) formData.append("image", editForm.image);

      await api.put(`/lost-found/${editingItem.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Item updated successfully!");
      setEditingItem(null);
      fetchMyItems();
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err?.response?.data?.message || "Failed to update item");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Status Quick Toggle ─────────────────────────────────────────────────────
  const handleQuickStatusChange = async (item: LostFoundItem, newStatus: "open" | "resolved" | "claimed") => {
    try {
      await api.patch(`/lost-found/${item.id}/status`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchMyItems();
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  // ── Delete Item ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete this report?",
      text: "This action cannot be undone. Are you sure you want to remove this item report?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-3xl",
        confirmButton: "rounded-full px-6 py-2.5",
        cancelButton: "rounded-full px-6 py-2.5",
      },
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/lost-found/${id}`);
        toast.success("Report deleted successfully");
        fetchMyItems();
      } catch (err: any) {
        console.error("Delete error:", err);
        toast.error(err?.response?.data?.message || "Failed to delete item");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/passenger/lost&found"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition mb-6 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform text-xs" /> Back to Lost & Found
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl shrink-0">
              <FaBoxOpen />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                My Reported Items
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage, edit, or mark your reported lost & found items as resolved
              </p>
            </div>
          </div>

          <Link href="/passenger/lost&found">
            <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-full font-semibold text-sm transition shadow-md shadow-emerald-600/20">
              <FaPlus /> Report Another Item
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 mb-6 self-start inline-flex">
          <button
            onClick={() => setActiveTab("lost")}
            className={`px-8 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              activeTab === "lost"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Lost Items
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`px-8 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              activeTab === "found"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Found Items
          </button>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-3.5 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <img
              src="/icons/lostFound.png"
              alt="No Items"
              className="w-20 h-20 mx-auto mb-4 opacity-40 object-contain"
            />
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              No {activeTab === "lost" ? "Lost" : "Found"} Items Reported
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              You have not reported any {activeTab} items yet.
            </p>
            <Link href="/passenger/lost&found">
              <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition shadow-md shadow-blue-500/20">
                <FaPlus /> Report Now
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const imgUrl = buildImageUrl(item.image);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-gray-100 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icons/lostFound.png";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                          {item.itemName}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            item.status === "resolved"
                              ? "bg-gray-100 text-gray-600"
                              : item.status === "claimed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-1">
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

                      <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-red-400 text-xs shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Status Toggle Button */}
                    {item.status === "open" ? (
                      <button
                        onClick={() => handleQuickStatusChange(item, "resolved")}
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-semibold transition"
                        title="Mark as Resolved / Found"
                      >
                        <FaCheckCircle /> Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickStatusChange(item, "open")}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
                        title="Reopen item"
                      >
                        Reopen
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center justify-center w-9 h-9 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition"
                      title="Edit Item Details"
                    >
                      <FaPencilAlt className="text-xs" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center justify-center w-9 h-9 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition"
                      title="Delete Report"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Edit Item Modal ─────────────────────────────────────────────────── */}
        {editingItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !savingEdit) setEditingItem(null);
            }}
          >
            <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                disabled={savingEdit}
                onClick={() => setEditingItem(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
              >
                <FaTimes />
              </button>

              <div className="mb-6">
                <p className="text-xs tracking-[0.2em] text-blue-600 uppercase font-bold mb-1">
                  Edit Report
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  Update Item Details
                </h2>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Bus Number *
                    </label>
                    <input
                      type="text"
                      name="busNumber"
                      value={editForm.busNumber}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="itemType"
                      value={editForm.itemType}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                      <option value="claimed">Claimed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={editForm.contactPhone}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={editForm.contactEmail}
                      onChange={handleEditChange}
                      className="w-full p-3 border border-gray-200 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Picture */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Replace Picture (Optional)
                  </label>
                  <div className="flex items-center gap-4 p-3.5 border border-dashed border-gray-300 rounded-2xl bg-slate-50">
                    {editImagePreview && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-gray-200">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <label className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-blue-700 transition">
                        Select New Image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleEditFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {editForm.image ? editForm.image.name : "Keep existing image or upload new one"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => setEditingItem(null)}
                    className="rounded-full border border-gray-200 bg-slate-100 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {savingEdit ? "Updating..." : "Save Changes"}
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
