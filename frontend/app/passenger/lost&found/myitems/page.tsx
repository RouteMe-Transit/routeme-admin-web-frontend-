"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";

interface MyItem {
  id: number;
  name: string;
  date: string;
  location: string;
  status: "lost" | "found";
  image: string;
}

const myItemsData: MyItem[] = [
  {
    id: 1,
    name: "Black Backpack",
    date: "Bus 12 • Mar 4, 2026",
    location: "Near Galle Face stop",
    status: "lost",
    image: "/icons/lostFound.png",
  },
  {
    id: 2,
    name: "Blue Umbrella",
    date: "Bus 88 • Mar 3, 2026",
    location: "Central stop",
    status: "lost",
    image: "/icons/lostFound.png",
  },
  {
    id: 3,
    name: "Samsung Phone",
    date: "Bus 45 • Mar 3, 2026",
    location: "Black case with crack",
    status: "found",
    image: "/icons/lostFound.png",
  },
];

export default function MyItems() {
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<MyItem[]>(myItemsData);
  const [editingId, setEditingId] = useState<number | null>(null);

  const filteredItems = items.filter((item) => item.status === activeTab);

  const handleDelete = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-8">
      {/* Back Button */}
      <Link href="/passenger/lost&found" className="inline-flex items-center text-blue-500 hover:text-blue-600 mb-6">
        ← Back to Lost & Found
      </Link>

      {/* Header */}
      <div className="flex items-center mb-8">
        <img src="/icons/lostFound.png" alt="My Items" className="w-10 h-10 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">My Items</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("lost")}
          className={`px-10 py-3 rounded-full font-semibold transition ${
            activeTab === "lost"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Lost Items
        </button>
        <button
          onClick={() => setActiveTab("found")}
          className={`px-10 py-3 rounded-full font-semibold transition ${
            activeTab === "found"
              ? "bg-cyan-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Found Items
        </button>
      </div>

      {/* Items Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Items</h2>
        <Link href="/passenger/lost&found">
          <button className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition">
            + Report
          </button>
        </Link>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-6 flex-1">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-contain"
                />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.date}</p>
                  <p className="text-sm text-gray-400">{item.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingId(item.id)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  title="Edit"
                >
                  <span className="text-gray-600">✎</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg hover:bg-red-500 hover:text-white transition"
                  title="Delete"
                >
                  <span>🗑</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No {activeTab} items yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
