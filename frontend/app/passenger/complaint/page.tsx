"use client";

import React, { useState } from "react";

type Complaint = {
  id: number;
  category: string;
  busNumber: string;
  description: string;
  status: "Pending";
};

export default function PassengerComplaint() {
  const [formData, setFormData] = useState({
    category: "",
    busNumber: "",
    description: "",
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newComplaint: Complaint = {
      id: complaints.length + 1,
      category: formData.category,
      busNumber: formData.busNumber,
      description: formData.description,
      status: "Pending",
    };

    setComplaints([newComplaint, ...complaints]);

    console.log("Submitted:", newComplaint);

    // RESET FORM
    setFormData({
      category: "",
      busNumber: "",
      description: "",
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">

      <div className="flex-1 flex flex-col">

        <main className="p-6 flex justify-center">
          <div className="w-full bg-white rounded-2xl shadow-md p-8">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* CATEGORY DROPDOWN (FIXED) */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Punctuality">Punctuality</option>
                  <option value="Driver Behavior">Driver Behavior</option>
                  <option value="Route Issue">Route Issue</option>
                  <option value="Safety">Safety</option>
                  <option value="Overcrowding">Overcrowding</option>
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* BUS NUMBER */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Bus Number
                </label>

                <input
                  type="text"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
                  placeholder="Enter bus number"
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="Describe the issue..."
                  required
                />
              </div>

              {/* SUBMIT */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-[#50b18d] hover:bg-[#3f9c79] text-white font-semibold px-8 py-3 rounded-xl transition"
                >
                  Submit Complaint
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
}