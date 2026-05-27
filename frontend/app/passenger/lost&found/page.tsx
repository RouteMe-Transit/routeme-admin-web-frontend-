"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";

const itemsData = [
  {
    id: 1,
    name: "Black Backpack",
    date: "Bus 12 • Mar 4, 2026",
    description: "Near Galle Face stop",
    status: "lost",
    image: "/icons/lostFound.png",
  },
  {
    id: 2,
    name: "Samsung Phone",
    date: "Bus 45 • Mar 3, 2026",
    description: "Black case with crack",
    status: "found",
    image: "/icons/lostFound.png",
  },
  {
    id: 3,
    name: "Blue Umbrella",
    date: "Bus 88 • Mar 3, 2026",
    description: "",
    status: "lost",
    image: "/icons/lostFound.png",
  },
  {
    id: 4,
    name: "Reading Glasses",
    date: "Bus 21 • Mar 2, 2026",
    description: "",
    status: "found",
    image: "/icons/lostFound.png",
  },
  {
    id: 5,
    name: "School Bag",
    date: "Bus 12 • Mar 1, 2026",
    description: "",
    status: "lost",
    image: "/icons/lostFound.png",
  },
];

export default function LostFound() {
  const [activeTab, setActiveTab] = useState("lost");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    busNumber: '',
    date: '',
    time: '',
    location: '',
    description: '',
    image: null as File | null,
  });

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Handle form submission, e.g., send to API
    console.log(form);
    setShowModal(false);
    setForm({
      name: '',
      busNumber: '',
      date: '',
      time: '',
      location: '',
      description: '',
      image: null,
    });
  };

  const filteredItems = itemsData.filter(
    (item) => item.status === activeTab
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-8">
      
      {/* Tabs + My Items */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-white rounded-full p-1 shadow">
          <button
            onClick={() => setActiveTab("lost")}
            className={`px-10 py-3 rounded-full font-semibold transition ${
              activeTab === "lost"
                ? "bg-blue-400 text-white"
                : "text-gray-500"
            }`}
          >
            Lost Items
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`px-10 py-3 rounded-full font-semibold transition ${
              activeTab === "found"
                ? "bg-blue-400 text-white"
                : "text-gray-500"
            }`}
          >
            Found Items
          </button>
        </div>

        <Link href="/passenger/lost&found/myitems">
          <button className="bg-blue-100 px-6 py-3 rounded-full hover:bg-blue-200 transition">
            My Items
          </button>
        </Link>
      </div>

      {/* Search + Report */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-xl items-center bg-gray-100 px-4 rounded-lg">
          <span className="text-gray-500 mr-3 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search Items"
            className="w-full p-3 bg-transparent outline-none"
          />
        </div>

        <button
          className="w-full rounded-lg bg-green-500 px-6 py-3 text-white sm:w-auto"
          onClick={() => setShowModal(true)}
          className="bg-green-500 text-white px-6 py-3 rounded-lg"
        >
          + Report Item
        </button>
      </div>

      <p className="font-semibold mb-4">12 reports this week</p>

      {/* List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center bg-white p-4 rounded-lg shadow-sm"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-contain"
            />

            <div className="ml-6 flex-1">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <p className="text-gray-400 text-sm">{item.date}</p>
              <p className="text-gray-500 text-sm">{item.description}</p>
            </div>

            {item.status === "lost" && (
              <span className="bg-red-100 text-red-500 px-4 py-1 rounded-lg font-semibold">
                Lost
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[34px] shadow-[0_25px_80px_rgba(84,121,255,0.12)] w-full max-w-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
            <div className="mb-6">
              <p className="text-xs tracking-[0.24em] text-blue-500 uppercase font-semibold mb-2">
                Report Item
              </p>
              <h2 className="text-3xl font-bold text-gray-900">Add a lost item</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Name of the Item</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Black Backpack"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-gray-200 rounded-3xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Bus Number</label>
                  <input
                    type="text"
                    name="busNumber"
                    placeholder="e.g., 12"
                    value={form.busNumber}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-gray-200 rounded-3xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-gray-200 rounded-3xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleFormChange}
                    className="w-full p-4 border border-gray-200 rounded-3xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Where it was lost</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Near Galle Face stop"
                  value={form.location}
                  onChange={handleFormChange}
                  className="w-full p-4 border border-gray-200 rounded-3xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Small Description</label>
                <textarea
                  name="description"
                  placeholder="Short description of the item"
                  value={form.description}
                  onChange={handleFormChange}
                  className="w-full p-4 border border-gray-200 rounded-3xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Picture of the item</label>
                <div className="flex items-center gap-4 rounded-3xl border border-dashed border-gray-200 bg-slate-50 p-4">
                  <label className="inline-flex items-center justify-center rounded-3xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white cursor-pointer hover:bg-blue-600 transition">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {form.image ? form.image.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-gray-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-200/30 hover:from-cyan-500 hover:to-blue-600 transition"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
