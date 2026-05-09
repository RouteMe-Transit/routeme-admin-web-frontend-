"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ALERT_LABEL_MAP,
  ALERT_STYLE_MAP,
  ALERT_TYPE_OPTIONS,
  AlertTypeValue,
} from "@/config/alertTypes";
import AlertHistoryItemCard from "./AlertHistoryItemCard";
import AlertHistoryViewModal from "./AlertHistoryViewModal";
import { FaEye } from "react-icons/fa6";
import AlertPreviewModal from "./AlertPreviewModal";
import AlertScheduleModal from "./AlertScheduleModal";
import type { AlertHistoryItem, AlertHistoryStatus } from "./types";

const initialAlertHistory: AlertHistoryItem[] = [
  {
    id: 1,
    title: "Roadblock on A2",
    description: "Roadblock due to accident near junction, expect delays.",
    type: "Service-Distruption",
    status: "published",
    targetAudience: "All Passengers",
    affectedRoute: "100",
    affectedBus: "NA-1876",
    timestamp: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    createdBy: { type: "bus", id: "bus-42", name: "Driver 42" },
  },
  {
    id: 2,
    title: "Weather delay on 103",
    description: "Heavy rain causing delays on route 103.",
    type: "Service-Distruption",
    status: "scheduled",
    targetAudience: "Route 103",
    affectedRoute: "103",
    affectedBus: "",
    timestamp: new Date().toISOString(),
    scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    createdBy: { type: "admin", id: "admin-1", name: "System Admin" },
  },
];

export default function AdminAlertsPage() {
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [alertType, setAlertType] = useState<AlertTypeValue>("Service-Distruption");
  const [affectedRoute, setAffectedRoute] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetRoute, setTargetRoute] = useState("");
  const [isPublicAlert, setIsPublicAlert] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>(initialAlertHistory);
  const [selectedHistoryAlert, setSelectedHistoryAlert] = useState<AlertHistoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "admin" | "bus">("all");
  const [filterAlertType, setFilterAlertType] = useState("");
  const [filterAffectedRoute, setFilterAffectedRoute] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const uniqueRoutes = Array.from(new Set(alertHistory.map((item) => item.affectedRoute).filter(Boolean)));

  const filteredAlerts = alertHistory.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.affectedRoute.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCreatorFilter = filterType === "all" || item.createdBy?.type === filterType;
    const matchesTypeFilter = filterAlertType === "" || item.type === filterAlertType;
    const matchesRouteFilter = filterAffectedRoute === "" || item.affectedRoute === filterAffectedRoute;
    const matchesStatusFilter = filterStatus === "" || item.status === filterStatus;
    return matchesSearch && matchesCreatorFilter && matchesTypeFilter && matchesRouteFilter && matchesStatusFilter;
  });

  const canSubmit =
    alertType.trim() !== "" &&
    affectedRoute.trim() !== "" &&
    alertTitle.trim() !== "" &&
    description.trim() !== "" &&
    (isPublicAlert || targetRoute.trim() !== "");

  const previewStyle = ALERT_STYLE_MAP[alertType];
  const selectedAlertLabel = ALERT_LABEL_MAP[alertType];
  const getTargetAudience = () => (isPublicAlert ? "All Passengers" : targetRoute);

  const addHistoryItem = (status: AlertHistoryStatus, scheduledAt?: string) => {
    setAlertHistory((currentHistory) => [
      {
        id: Date.now(),
        title: alertTitle,
        description,
        type: alertType,
        status,
        targetAudience: getTargetAudience(),
        affectedRoute,
        affectedBus: "",
        timestamp: new Date().toISOString(),
        scheduledAt,
        sentAt: status === "published" ? new Date().toISOString() : undefined,
        createdBy: { type: "admin", id: "admin-1", name: "Admin User" },
      },
      ...currentHistory,
    ]);
  };

  const handleCreateAlert = () => {
    addHistoryItem("published");
    toast.success("Alert published successfully");
    setShowCreatePage(false);
  };

  const handleConfirmSchedule = () => {
    const date = new Date(scheduleAt);
    if (Number.isNaN(date.getTime())) {
      toast.error("Invalid date/time");
      return;
    }

    addHistoryItem("scheduled", date.toISOString());
    toast.success("Alert scheduled");
    setShowSchedule(false);
    setShowCreatePage(false);
  };

  useEffect(() => {
    const promoteScheduledAlerts = () => {
      const now = Date.now();
      setAlertHistory((currentHistory) => {
        let changed = false;
        const nextHistory = currentHistory.map((item) => {
          if (item.status !== "scheduled" || !item.scheduledAt) {
            return item;
          }

          const scheduledAtMs = Date.parse(item.scheduledAt);
          if (Number.isNaN(scheduledAtMs) || scheduledAtMs > now) {
            return item;
          }

          changed = true;
          return {
            ...item,
            status: "published" as AlertHistoryStatus,
            timestamp: new Date().toISOString(),
          };
        });

        return changed ? nextHistory : currentHistory;
      });
    };

    promoteScheduledAlerts();
    const timerId = window.setInterval(promoteScheduledAlerts, 30000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <>
      <section className="p-6">
        {!showCreatePage ? (
          <>
            <div className="rounded-xl border border-gray-100 mb-4 ">
              <div className="flex flex-wrap items-center gap-3 ">
                <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm ">
                  <img src="/icons/lens.png" className="w-5 h-5 opacity-50" alt="" />
                  <input
                    type="text"
                    placeholder="Search title, description, or route..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none text-black"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "all" | "admin" | "bus")}
                  className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
                >
                  <option value="all">All Creators</option>
                  <option value="admin">Admin Only</option>
                  <option value="bus">Bus Only</option>
                </select>
                <select
                  value={filterAlertType}
                  onChange={(e) => setFilterAlertType(e.target.value)}
                  className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
                >
                  <option value="">All Types</option>
                  {ALERT_TYPE_OPTIONS.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterAffectedRoute}
                  onChange={(e) => setFilterAffectedRoute(e.target.value)}
                  className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
                >
                  <option value="">All Routes</option>
                  {uniqueRoutes.map((route) => (
                    <option key={route} value={route}>
                      Route {route}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                <button
                  onClick={() => setShowCreatePage(true)}
                  className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-md"
                >
                  + Create Alert
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-[90px_1.1fr_1fr_1fr_1.4fr_1.1fr_1fr_110px_70px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
                <div className="whitespace-nowrap">Alert ID</div>
                <div>Type</div>
                <div>Affected Bus</div>
                <div>Affected Route</div>
                <div>Title</div>
                <div>Target Audience</div>
                <div>Created By</div>
                <div>Status</div>
                <div className="text-center">Action</div>
              </div>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-[90px_1.1fr_1fr_1fr_1.4fr_1.1fr_1fr_110px_70px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
                    <div className="font-semibold text-[#122843] whitespace-nowrap">{item.id}</div>
                    <div className="font-medium text-gray-700">{ALERT_LABEL_MAP[item.type]}</div>
                    <div className="text-gray-600">{item.affectedBus || "—"}</div>
                    <div className="text-gray-600">{item.affectedRoute || "—"}</div>
                    <div className="text-gray-600">{item.title}</div>
                    <div className="text-gray-600">{item.targetAudience}</div>
                    <div className="text-gray-600 capitalize">{item.createdBy?.type || "—"}</div>
                    <div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${item.status === "published" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                        {item.status === "published" ? "Published" : "Scheduled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <button onClick={() => setSelectedHistoryAlert(item)} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition">
                        <FaEye className="text-blue-600" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">No alerts found</div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Create New Alert</h2>
              <button
                onClick={() => setShowCreatePage(false)}
                className="h-10 bg-gray-300 text-gray-700 font-semibold px-6 rounded-lg hover:bg-gray-400 transition shadow-md"
              >
                Back to List
              </button>
            </div>

            <label className="block mb-5 font-semibold">Alert Type:</label>
            <select className="h-10 border rounded-md border-[#828282]/70 px-2" value={alertType} onChange={(e) => setAlertType(e.target.value as AlertTypeValue)}>
              {ALERT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="block mb-5 mt-5 font-semibold">Affected Route/Bus:</label>
            <input type="text" className="w-80 h-10 border rounded-md border-[#828282]/70 px-2" placeholder="Enter affected route or bus number" value={affectedRoute} onChange={(e) => setAffectedRoute(e.target.value)} />

            <label className="block mb-5 mt-5 font-semibold">Alert Title:</label>
            <input type="text" className="w-150 h-10 border rounded-md border-[#828282]/70 px-2" placeholder="Enter a concise title for the alert" value={alertTitle} onChange={(e) => setAlertTitle(e.target.value)} />

            <label className="block mb-5 mt-5 font-semibold">Description:</label>
            <textarea className="w-full h-24 border rounded-md border-[#828282]/70 px-2 py-1" placeholder="Enter detailed description of the alert" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>

            <label className="block mb-5 mt-5 font-semibold">Target Audience:</label>
            <div className="flex items-end gap-1">
              <div className="flex-1">
                <select className="h-10 w-50 border rounded-md border-[#828282]/70 px-2" value={targetRoute} onChange={(e) => { setTargetRoute(e.target.value); if (e.target.value) setIsPublicAlert(false); }} disabled={isPublicAlert}>
                  <option value="" disabled>
                    Select a route
                  </option>
                  <option value="100">100 Panadura - Pettah</option>
                  <option value="101">101 Moratuwa - Pettah</option>
                  <option value="102">102 Moratuwa - Kotahena</option>
                  <option value="103">103 Narahenpita - Fort</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mr-90">
                <input id="public-alert" type="checkbox" className="h-5 w-5 rounded border-gray-300 text-blue-500" checked={isPublicAlert} disabled={targetRoute !== ""} onChange={(e) => { setIsPublicAlert(e.target.checked); if (e.target.checked) setTargetRoute(""); }} />
                <label htmlFor="public-alert" className="font-semibold text-slate-700 whitespace-nowrap">Public Alert</label>
              </div>
            </div>

            <div>
              <p className="mt-3 text-sm font-medium text-gray-600">* If "Public Alert" is checked, the alert will be sent to all passengers. Otherwise, it will only be sent to passengers of the selected route.</p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button className="bg-yellow-500 px-4 py-2 rounded-md text-white hover:bg-yellow-600" onClick={() => setShowPreview(true)}>
                  Preview
                </button>
                <button disabled={!canSubmit} onClick={() => setShowSchedule(true)} className="bg-green-500 px-4 py-2 rounded-md text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-blue-400">
                  Schedule
                </button>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button disabled={!canSubmit} className="bg-[#4CAF8A] text-white font-semibold px-6 h-10 rounded-lg hover:bg-[#3d9e7a] transition shadow-md disabled:cursor-not-allowed disabled:bg-gray-400" onClick={handleCreateAlert}>
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <AlertHistoryViewModal item={selectedHistoryAlert} onClose={() => setSelectedHistoryAlert(null)} />

      <AlertPreviewModal open={showPreview} onClose={() => setShowPreview(false)} previewCardClass={previewStyle.cardClass} selectedAlertLabel={selectedAlertLabel} affectedRoute={affectedRoute} alertTitle={alertTitle} description={description} isPublicAlert={isPublicAlert} targetRoute={targetRoute} />

      <AlertScheduleModal open={showSchedule} scheduleAt={scheduleAt} onScheduleAtChange={setScheduleAt} onCancel={() => setShowSchedule(false)} onConfirm={handleConfirmSchedule} />
    </>
  );
}
