"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [reportText, setReportText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportText.trim()) {
      alert("Please enter a report before submitting.");
      return;
    }

    alert("Report submitted successfully!");
    setReportText("");
  };

  return (
    <div className="max-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-8">
        
        {/* Title */}
        <p className="text-gray-500 mb-6">
          Submit operational reports for your bus
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Label */}
          <label className="block text-gray-600 mb-2">
            Write your report
          </label>

          {/* Textarea */}
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Describe delays, issues, or observations..."
            className="w-full h-48 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none resize-none"
          />

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="px-6 py-3 bg-[#122843] text-white rounded-xl hover:opacity-90 transition"
            >
              Submit Report
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}