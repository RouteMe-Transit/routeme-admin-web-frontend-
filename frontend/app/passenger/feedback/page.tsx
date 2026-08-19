"use client";

import { useState } from "react";
import api from "@/app/services/api";
import { z } from "zod";
import toast from "react-hot-toast";

type Submission = {
  id: number;
  name: string;
  category: string;
  rating: number;
  message: string;
  meta: string;
};


const getAuthConfig = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

export default function PassengerFeedback() {
  const [formData, setFormData] = useState({
    category: "",
    busNumber: "",
    message: "",
    rating: 0,
  });

  // submissions removed — recent submissions UI was removed per request

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    const schema = z.object({
      category: z.string().min(1, "Please select a category"),
      busNumber: z.string().min(1, "Please enter the bus number"),
      message: z.string().min(10, "Message must be at least 10 characters"),
      rating: z.number().min(1, "Please give a rating"),
    });

    const parsed = schema.safeParse({
      category: formData.category,
      busNumber: formData.busNumber,
      message: formData.message,
      rating: formData.rating,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues?.[0]?.message || "Invalid input");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post(
        "/feedbacks",
        {
          category: formData.category,
          busNumber: formData.busNumber,
          message: formData.message,
          rating: formData.rating,
        },
        getAuthConfig()
      );

      const createdFeedback = response.data?.data || response.data;
      toast.success("Feedback submitted successfully.");
      setFormData({
        category: "",
        busNumber: "",
        message: "",
        rating: 0,
      });
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Unable to submit feedback. Please try again.";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
      <div className="w-full bg-white rounded-2xl shadow-md p-8">

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700">
              {success}
            </div>
          )}

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

      {/* Recent submissions removed per request */}
    </div>
  );
}