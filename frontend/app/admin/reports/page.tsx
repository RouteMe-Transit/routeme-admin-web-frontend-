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
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-4 bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-600 border-b uppercase tracking-wide">
          <div>Report ID</div>
          <div>Bus Number</div>
          <div>Report</div>
          <div className="text-center">Action</div>
        </div>

        {filteredReports.length > 0 ? (
          filteredReports.map((item, index) => {
            const reportCode = `R${String(index + 1).padStart(2, "0")}`;

            return (
              <div
                key={item.id}
                className="grid grid-cols-4 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
              >
                <div className="font-semibold">
                  <span className="bg-[#122843] text-white px-2 py-1 rounded text-sm">
                    {reportCode}
                  </span>
                </div>

                <div>{item.busNumber}</div>

                <div className="max-w-[250px]">
                  <p className="truncate text-sm text-gray-700" title={item.report}>
                    {item.report}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setSelectedReport(item)}
                    className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition"
                  >
                    <IoEye size={18} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => markAsViewed(item.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      viewedReports.includes(item.id)
                        ? "bg-green-50 hover:bg-green-100"
                        : "bg-red-50 hover:bg-red-100"
                    }`}
                    title={
                      viewedReports.includes(item.id)
                        ? "Click to mark as unviewed"
                        : "Click to mark as viewed"
                    }
                    aria-label={
                      viewedReports.includes(item.id)
                        ? "Mark report as unviewed"
                        : "Mark report as viewed"
                    }
                  >
                    <IoCheckmarkDoneCircle
                      size={18}
                      className={viewedReports.includes(item.id) ? "text-green-600" : "text-red-600"}
                    />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-gray-400 text-sm">No reports found</div>
        )}
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