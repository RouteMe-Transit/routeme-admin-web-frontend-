"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";

export default function ReportsPage() {
  const [reportText, setReportText] = useState("");
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      alert("Please enter a report before submitting.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not authenticated. Please login.");
      return;
    }

    setLoading(true);
    try {
      const parsed = z.object({ content: z.string().min(10, "Report must be at least 10 characters") }).safeParse({ content: reportText });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }

      const res = await fetch(`${apiBase}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: reportText }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to submit (${res.status})`);
      }

      toast.success("Report submitted successfully!");
      setReportText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-8">
        <p className="text-gray-500 mb-6">Submit operational reports for your bus</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-gray-600 mb-2">Write your report</label>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Describe delays, issues, or observations..."
            className="w-full h-48 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none resize-none"
          />

          <div className="flex justify-end mt-6">
            <button type="submit" disabled={loading} className="px-6 py-3 bg-[#122843] text-white rounded-xl hover:opacity-90 transition">
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}