"use client";
import { useState } from "react";
import { CgClose } from "react-icons/cg";
import { IoEye } from "react-icons/io5";
import { IoCheckmarkDoneCircle } from "react-icons/io5";

type Report = {
  id: number;
  busNumber: string;
  report: string;
};

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewedReports, setViewedReports] = useState<number[]>([]);

  // ✅ Sample data
  const [reports] = useState<Report[]>([
    {
      id: 1,
      busNumber: "138",
      report:
        "The bus was extremely late and overcrowded. Passengers had to wait for more than 40 minutes which caused inconvenience to many people going to work.",
    },
    {
      id: 2,
      busNumber: "122",
      report:
        "Driver was driving very fast and dangerously. Needs immediate attention from authorities.",
    },
    {
      id: 3,
      busNumber: "300",
      report:
        "Bus was clean and comfortable. However, the conductor was not issuing tickets properly.",
    },
  ]);

  // ✅ Filter
  const filteredReports = reports.filter(
    (r) =>
      r.busNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.report.toLowerCase().includes(search.toLowerCase())
  );

  const markAsViewed = (reportId: number) => {
    setViewedReports((prev) =>
      prev.includes(reportId) ? prev : [...prev, reportId]
    );
  };

  return (
    <section className="p-6 space-y-6">
      
      <div className="flex  items-center justify-between gap-4">
        {/* Search */}
      <div className="w-1/3">
        <input
          type="text"
          placeholder="Search Reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-300 bg-white p-2 rounded-md"
        />
      </div>
      <label className="border w-30 h-10 rounded-md bg-[#122843] text-white font-bold flex items-center justify-center">
                    Total: {reports.length}
                </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full border-collapse">

          {/* Header */}
          <thead className="bg-[#122843] text-white">
            <tr>
              <th className="p-3 text-left">Report ID</th>
              <th className="p-3 text-left">Bus Number</th>
              <th className="p-3 text-left">Report</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No reports found
                </td>
              </tr>
            ) : (
              filteredReports.map((item, index) => {
                const reportCode = `R${String(index + 1).padStart(2, "0")}`;

                return (
                  <tr
                    key={item.id}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-blue-50`}
                  >
                    {/* Report ID */}
                    <td className="p-3">
                      <span className="bg-[#122843] text-white px-2 py-1 rounded text-sm">
                        {reportCode}
                      </span>
                    </td>

                    {/* Bus */}
                    <td className="p-3">{item.busNumber}</td>

                    {/* Truncated Report */}
                    <td className="p-3 max-w-[250px]">
                      <p className="truncate text-sm text-gray-700" title={item.report}>
                        {item.report}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-3 flex gap-4">
                      <button
                        onClick={() => setSelectedReport(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <IoEye size={20} />
                      </button>
                      <button
                        onClick={() => markAsViewed(item.id)}
                        className={`transition-colors ${
                          viewedReports.includes(item.id)
                            ? "text-green-600 hover:text-green-700"
                            : "text-red-600 hover:text-red-700"
                        }`}
                        title={
                          viewedReports.includes(item.id)
                            ? "Marked as viewed"
                            : "Mark as viewed"
                        }
                        aria-label={
                          viewedReports.includes(item.id)
                            ? "Marked as viewed"
                            : "Mark report as viewed"
                        }
                      >
                        <IoCheckmarkDoneCircle size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

      {/* View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Report Details</h2>
              <button
                className="bg-red-500 hover:bg-red-600 p-1 rounded"
                onClick={() => setSelectedReport(null)}
              >
                <CgClose size={16} color="white" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3 text-sm">
              
              <p>
                <span className="font-semibold">Bus Number:</span>{" "}
                {selectedReport.busNumber}
              </p>

              <p>
                <span className="font-semibold">Report:</span>
              </p>

              <p className="bg-gray-100 p-3 rounded break-words whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedReport.report}
              </p>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}