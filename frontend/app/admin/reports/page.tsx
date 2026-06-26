"use client";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CgClose } from "react-icons/cg";
import { IoEye } from "react-icons/io5";
import { IoCheckmarkDoneCircle } from "react-icons/io5";

type ApiReport = {
  id: number;
  busNumber?: string | null;
  content: string;
  status?: string;
  createdAt?: string;
  user?: { id: number; firstName: string; lastName: string; email: string } | null;
};

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<ApiReport | null>(null);
  const [viewedReports, setViewedReports] = useState<number[]>([]);
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchReports = useCallback(async (searchArg?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const q = (searchArg ?? search) ? `&search=${encodeURIComponent(searchArg ?? search)}` : "";
      const res = await fetch(`${apiBase}/reports?limit=100${q}`, { headers });
      if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
      const payload = await res.json();
      const data = payload.data ?? payload.reports ?? payload;
      setReports(Array.isArray(data) ? data : data.reports ?? []);
    } catch (err: any) {
      const msg = err.message || "Failed to load reports";
      setError(msg);
      toast.error("Unable to load reports. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const t = setTimeout(() => fetchReports(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchReports]);

  const markAsViewed = (reportId: number) => {
    setViewedReports((prev) => (prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]));
  };

  const filteredReports = reports; // server-side search applied

  return (
    <section className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search Reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 bg-white p-2 rounded-md"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-[#122843] px-4 py-2 text-sm font-bold text-white">Total: {reports.length}</span>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading reports...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <div>
            <div className="grid grid-cols-4 gap-4 bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-600 border-b uppercase tracking-wide">
              <div>Report ID</div>
              <div>Bus Number</div>
              <div>Report</div>
              <div className="text-center">Action</div>
            </div>

            {filteredReports.length > 0 ? (
              filteredReports.map((item, index) => {
                const reportCode = `R${String(index + 1).padStart(2, "0")}`;
                return (
                  <div key={item.id} className="grid grid-cols-4 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
                    <div className="font-semibold">
                      <span className="bg-[#122843] text-white px-2 py-1 rounded text-sm">{reportCode}</span>
                    </div>

                    <div>{item.busNumber ?? (item.user ? `${item.user.firstName} ${item.user.lastName}` : "-")}</div>

                    <div className="min-w-0 pr-2">
                      <p className="truncate text-sm text-gray-700" title={item.content}>
                        {item.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setSelectedReport(item)} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition">
                        <IoEye size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => markAsViewed(item.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                          viewedReports.includes(item.id) ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"
                        }`}
                        title={viewedReports.includes(item.id) ? "Click to mark as unviewed" : "Click to mark as viewed"}
                        aria-label={viewedReports.includes(item.id) ? "Mark report as unviewed" : "Mark report as viewed"}
                      >
                        <IoCheckmarkDoneCircle size={18} className={viewedReports.includes(item.id) ? "text-green-600" : "text-red-600"} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 text-gray-400 text-sm">No reports found</div>
            )}
          </div>
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Report Details</h2>
              <button className="bg-red-500 hover:bg-red-600 p-1 rounded" onClick={() => setSelectedReport(null)}>
                <CgClose size={16} color="white" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">Bus Number:</span> {selectedReport.busNumber ?? (selectedReport.user ? `${selectedReport.user.firstName} ${selectedReport.user.lastName}` : "-")}
              </p>

              <p>
                <span className="font-semibold">Report:</span>
              </p>

              <div className="mt-2">
                <div className="mt-2 bg-gray-100 p-3 rounded max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-gray-700">
                  {selectedReport.content}
                </div>
              </div>

              {selectedReport.createdAt && (
                <p className="text-xs text-gray-500">Submitted: {new Date(selectedReport.createdAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}