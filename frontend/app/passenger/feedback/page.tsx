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

const initialSubmissions: Submission[] = [
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

  const [submissions, setSubmissions] =
    useState<Submission[]>(initialSubmissions);

  // HANDLE INPUT
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // RATING CLICK
  const handleRating = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  // SUBMIT
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSubmission: Submission = {
      id: submissions.length + 1,
      name: "You",
      category: formData.category,
      rating: formData.rating,
      message: formData.message,
      meta: `Now · ${formData.busNumber}`,
    };

    setSubmissions([newSubmission, ...submissions]);

    // RESET FORM
    setFormData({
      category: "",
      busNumber: "",
      message: "",
      rating: 0,
    });
  };

  return (
    <div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
      <div className="w-full bg-white rounded-2xl shadow-md p-8">

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* CATEGORY DROPDOWN (FIXED) */}
          <div>
            <label className="block font-semibold mb-2">Category</label>
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
              <option value="Cleanliness">Cleanliness</option>
              <option value="Safety">Safety</option>
              <option value="Overall">Overall</option>
            </select>
          </div>

          {/* BUS NUMBER */}
          <div>
            <label className="block font-semibold mb-2">Bus Number</label>
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

          {/* RATING (FIXED STAR UI) */}
          <div>
            <label className="block font-semibold mb-2">Rating</label>
            <div className="flex gap-2 text-5xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`transition ${
                    formData.rating >= star
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* MESSAGE */}
          <div>
            <label className="block font-semibold mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="Write your feedback..."
              required
            />
          </div>

          {/* SUBMIT */}
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

      {/* RECENT SUBMISSIONS */}
      <div className="w-full max-w-5xl mt-10">
        <h3 className="text-xl font-bold mb-4">Recent Submissions</h3>

        <div className="grid md:grid-cols-2 gap-4">
          {submissions.map((item) => (
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