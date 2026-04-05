"use client";

import React, { useState } from "react";
import Sidebar from "@/app/components/sideBar/Sidebar";
import TopBar from "@/app/components/topBar/Topbar";
import { FaExclamationCircle } from "react-icons/fa";

export default function PassengerComplaint() {
  const [formData, setFormData] = useState({
    category: "",
    busNumber: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        <main className="p-6 flex justify-center">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">
              Submit Complaint
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
                  placeholder="Enter category"
                />
              </div>

              {/* Bus Number */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Bus Number
                </label>
                <input
                  type="text"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
                  placeholder="Enter bus number"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="Describe the issue..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-[#50b18d] hover:bg-[#3f9c79] text-white font-semibold px-8 py-3 rounded-xl transition"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}