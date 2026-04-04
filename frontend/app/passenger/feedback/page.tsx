"use client";

import { useState } from "react";

type Submission = {
  id: number;
  name: string;
  category: string;
  rating: number;
  message: string;
  meta: string;
};

const recentSubmissions: Submission[] = [
  {
    id: 1,
    name: "R. Rathnayaka",
    category: "Punctuality",
    rating: 4,
    message: "Bus 45 was late but driver informed passengers.",
    meta: "Mar 4 · Bus 45",
  },
  {
    id: 2,
    name: "M. Nawodya",
    category: "Cleanliness",
    rating: 3,
    message: "Seats could be cleaner. Good service overall.",
    meta: "Mar 3 · Bus 12",
  },
];

export default function PassengerFeedback() {
  const [formData, setFormData] = useState({
    category: "",
    busNumber: "",
    message: "",
    rating: 0,
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

  const handleRating = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
      <div className="w-full bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">Submit Feedback</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block font-semibold mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
              placeholder="Enter category"
            />
          </div>

          {/* Bus Number */}
          <div>
            <label className="block font-semibold mb-2">Bus Number</label>
            <input
              type="text"
              name="busNumber"
              value={formData.busNumber}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
              placeholder="Enter bus number"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block font-semibold mb-2">Rating</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center text-xl ${
                    formData.rating >= star
                      ? "bg-green-100 border-green-500"
                      : "bg-white"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block font-semibold mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="Write your feedback..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-[#50b18d] hover:bg-[#3f9c79] text-white font-semibold px-8 py-3 rounded-xl transition"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>

      {/* Recent Submissions */}
      <div className="w-full max-w-5xl mt-10">
        <h3 className="text-xl font-bold mb-4">Recent Submissions</h3>

        <div className="grid md:grid-cols-2 gap-4">
          {recentSubmissions.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg border shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{item.name}</h4>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                  {item.category}
                </span>
              </div>

              <div className="text-yellow-500 mb-1">
                {"⭐".repeat(item.rating)}
              </div>

              <p className="text-sm text-gray-700">{item.message}</p>
              <p className="text-xs text-gray-400 mt-1">{item.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}