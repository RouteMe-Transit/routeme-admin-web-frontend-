"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { z } from "zod";
import {
  ALERT_LABEL_MAP,
  ALERT_STYLE_MAP,
  ALERT_TYPE_OPTIONS,
  ALERT_TYPE_TO_BACKEND,
  AlertTypeValue,
} from "@/config/alertTypes";
import { FaEye, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import { IoEye } from "react-icons/io5";
import api from "@/app/services/api";
import { formatSriLankanTime, SRI_LANKA_TIMEZONE } from "@/utils/sriLankanTime";

const ALERT_TYPE_VALUE_SET = new Set<string>(ALERT_TYPE_OPTIONS.map((option) => option.value));

type BackendAlert = {
  id?: string | number;
  _id?: string;
  alertId?: string | number;
  title?: string;
  description?: string;
  type?: string;
  alertType?: string;
  status?: string;
  targetAudience?: string;
  targetRoute?: string;
  affectedRoute?: string;
  route?: string;
  affectedBus?: string;
  busNumber?: string;
  createdAt?: string;
  timestamp?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdBy?: number | {
    role?: string;
    id?: string | number;
    name?: string;
    displayName?: string;
  };
  createdByInfo?: {
    role?: string;
    id?: string | number;
    name?: string;
    displayName?: string;
  };
};

type BackendRoute = {
  id?: number | string;
  routeName?: string;
  routeNumber?: string;
  from?: string;
  to?: string;
};

type AlertHistoryStatus = "published" | "scheduled";

type CreatedBy = {
  role: "admin" | "bus" | string;
  id: string | number;
  name: string;
  displayName?: string;
};

const readString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const normalizeCreatedBy = (item: BackendAlert): CreatedBy | undefined => {
  const source = item.createdByInfo ?? (typeof item.createdBy === "object" ? item.createdBy : undefined);
  const role = readString(source?.role) ?? "";
  const id = readString(source?.id);
  const displayName = readString(source?.displayName) ?? readString(source?.name);
  const name = displayName ?? readString(source?.name);

  if (role || id || displayName || name) {
    return {
      role: role || "—",
      id: id ?? "—",
      name: name ?? displayName ?? "—",
      displayName: displayName ?? name ?? "—",
    };
  }

  return undefined;
};

const mergeAlertDetail = (item: AlertHistoryItem, detail: BackendAlert): BackendAlert => {
  const merged: BackendAlert = {
    ...item,
    ...detail,
  };

  if (!merged.createdBy && item.createdBy) {
    merged.createdBy = item.createdBy;
  }

  return merged;
};

const formatCreatedBySummary = (createdBy?: CreatedBy) => {
  if (!createdBy) {
    return "—";
  }

  const parts = [createdBy.role, createdBy.displayName ?? createdBy.name, createdBy.id]
    .map((part) => String(part).trim())
    .filter((part) => part !== "" && part !== "—");

  return parts.length > 0 ? parts.join(" • ") : "—";
};

const formatSriLankanDateTime = (input?: string) => {
  if (!input) return "—";
  try {
    const date = new Date(input);
    const datePart = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: SRI_LANKA_TIMEZONE }).format(date);
    const timePart = formatSriLankanTime(date);
    return `${datePart} ${timePart}`;
  } catch {
    return String(input);
  }
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function highlightText(text?: string, query?: string) {
  if (!text) return text ?? "";
  if (!query) return text;

  const q = query.trim();
  if (q === "") return text;

  const escaped = escapeRegExp(q);
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    return part.toLowerCase() === q.toLowerCase() ? (
      <mark key={idx} className="bg-yellow-200 rounded px-0.5">{part}</mark>
    ) : (
      part
    );
  });
}

type AlertHistoryItem = {
  id: string | number;
  displayId?: string;
  title: string;
  description: string;
  type: AlertTypeValue;
  status: AlertHistoryStatus;
  targetAudience: string;
  affectedRoute: string;
  affectedBus?: string;
  timestamp: string;
  scheduledAt?: string;
  sentAt?: string;
  createdBy?: CreatedBy;
};

const buildCreateAlertFormSchema = (routeIds: Set<string>) =>
  z
    .object({
      alertType: z
        .string()
        .trim()
        .refine((value) => ALERT_TYPE_VALUE_SET.has(value), "Alert type is required"),
      affectedRoute: z.string().trim().optional(),
      affectedBus: z.string().trim().optional(),
      alertTitle: z.string().trim().min(1, "Alert title is required"),
      description: z.string().trim().min(1, "Description is required"),
      isPublicAlert: z.boolean(),
      targetRoute: z.string().trim(),
    })
    .superRefine((value, ctx) => {
      if (!value.isPublicAlert && value.targetRoute === "") {
        ctx.addIssue({
          code: "custom",
          path: ["targetRoute"],
          message: "Select a target route or choose Public Alert",
        });
      }

      if (!value.isPublicAlert && value.targetRoute !== "" && !routeIds.has(value.targetRoute)) {
        ctx.addIssue({
          code: "custom",
          path: ["targetRoute"],
          message: "Target route must be selected from the route list",
        });
      }
    });

type AlertHistoryViewModalProps = {
  item: AlertHistoryItem | null;
  onClose: () => void;
};

function AlertHistoryViewModal({ item, onClose }: AlertHistoryViewModalProps) {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <button
          type="button"
          aria-label="Close history alert preview"
          className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
          onClick={onClose}
        >
          <FaXmark />
        </button>

        <h3 className="mb-5 text-lg font-bold text-gray-800">Alert Details</h3>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Title:</strong> {item.title}
          </p>
          <p>
            <strong>ID:</strong> {item.displayId ?? item.id}
          </p>
          <p>
            <strong>Type:</strong> {ALERT_LABEL_MAP[item.type]}
          </p>
          <p>
            <strong>Status:</strong> {item.status}
          </p>
          <p>
            <strong>Target:</strong> {item.targetAudience}
          </p>
          <p>
            <strong>Affected Route:</strong> {item.affectedRoute || "—"}
          </p>
          {item.affectedBus && (
            <p>
              <strong>Affected Bus:</strong> {item.affectedBus}
            </p>
          )}
          {item.scheduledAt && (
            <p>
              <strong>Scheduled for:</strong> {formatSriLankanDateTime(item.scheduledAt)}
            </p>
          )}
          {item.sentAt && (
            <p>
              <strong>Sent At:</strong> {formatSriLankanDateTime(item.sentAt)}
            </p>
          )}
          <p>
            <strong>Created:</strong> {formatSriLankanDateTime(item.timestamp)}
          </p>
          {item.createdBy && (
            <div>
              <p>
                <strong>Created By:</strong>
              </p>
              <div className="ml-4 text-sm text-gray-700">
                <p>
                  <strong>Role:</strong> {item.createdBy.role || "—"}
                </p>
                <p>
                  <strong>ID:</strong> {item.createdBy.id || "—"}
                </p>
                <p>
                  <strong>Name:</strong> {item.createdBy.displayName || item.createdBy.name || "—"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-md bg-gray-100 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Description</p>
          <p className="whitespace-pre-wrap wrap-break-word text-sm text-gray-700">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

type AlertPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  previewCardClass: string;
  selectedAlertLabel: string;
  affectedRoute: string;
  affectedBus: string;
  alertTitle: string;
  description: string;
  isPublicAlert: boolean;
  targetRoute: string;
};

function AlertPreviewModal({
  open,
  onClose,
  previewCardClass,
  selectedAlertLabel,
  affectedRoute,
  affectedBus,
  alertTitle,
  description,
  isPublicAlert,
  targetRoute,
}: AlertPreviewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-lg">
        <button
          type="button"
          aria-label="Close preview"
          className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-2xl text-red-500 hover:bg-red-500 hover:text-white"
          onClick={onClose}
        >
          <FaXmark />
        </button>
        <h2 className="mb-6 text-xl font-bold">Alert Preview</h2>

        <div className="mb-6 space-y-4">
          <div className={`rounded border-l-4 p-4 ${previewCardClass}`}>
            <p className="wrap-break-word text-sm text-gray-600">
              <strong>Alert Type:</strong> {selectedAlertLabel}
            </p>
            <p className="mt-2 wrap-break-word text-sm text-gray-600">
              <strong>Affected Route:</strong> {affectedRoute || "N/A"}
            </p>
            <p className="mt-2 wrap-break-word text-sm text-gray-600">
              <strong>Affected Bus:</strong> {affectedBus || "N/A"}
            </p>
            <p className="mt-3 wrap-break-word text-base font-bold text-gray-700">{alertTitle || "(No title entered)"}</p>
            <p className="mt-3 whitespace-pre-wrap wrap-break-word text-gray-700">{description || "(No description entered)"}</p>
            <p className="mt-4 wrap-break-word text-sm text-gray-600">
              <strong>Target Audience:</strong> {isPublicAlert ? "All Passengers" : targetRoute || "Not selected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type AlertScheduleModalProps = {
  open: boolean;
  scheduleAt: string;
  onScheduleAtChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function AlertScheduleModal({
  open,
  scheduleAt,
  onScheduleAtChange,
  onCancel,
  onConfirm,
}: AlertScheduleModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold">Schedule Alert</h3>
        <label className="mb-2 block text-sm font-semibold">Select Date and time</label>
        <input
          type="datetime-local"
          value={scheduleAt}
          onChange={(e) => onScheduleAtChange(e.target.value)}
          className="h-10 w-full rounded-md border border-[#828282] px-2"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            disabled={scheduleAt.trim() === ""}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            onClick={onConfirm}
          >
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

const getAuthConfig = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

const normalizeAlertType = (value?: string): AlertTypeValue => {
  if (!value) {
    return "Other";
  }

  const normalized = value.trim().toLowerCase();

  // Backend values with spaces
  if (normalized === "delay") {
    return "Delay";
  }

  if (normalized === "accident") {
    return "Accident";
  }

  if (normalized === "breakdown") {
    return "Breakdown";
  }

  if (normalized === "weather") {
    return "Weather";
  }

  if (normalized === "road block" || normalized === "road-block") {
    return "Road-Block";
  }

  if (normalized === "not operating" || normalized === "not-operating") {
    return "Not-Operating";
  }

  if (normalized === "route-change" || normalized === "route change") {
    return "Route-Change";
  }

  if (normalized === "heavy-rain" || normalized === "heavy rain") {
    return "Heavy-Rain";
  }

  if (normalized === "damaged-roads" || normalized === "damaged roads") {
    return "Damaged-Roads";
  }

  if (normalized === "rule-enforcement" || normalized === "rule enforcement") {
    return "Rule-Enforcement";
  }

  if (normalized === "new-bus-stop" || normalized === "new bus stop") {
    return "New-Bus-Stop";
  }

  if (normalized === "removed-bus-stop" || normalized === "removed bus stop") {
    return "Removed-Bus-Stop";
  }

  if (normalized === "public-events" || normalized === "public events") {
    return "Public-Events";
  }

  if (normalized === "service-distruption" || normalized === "service-disruption" || normalized === "service distruption") {
    return "Service-Distruption";
  }

  return ALERT_TYPE_VALUE_SET.has(value as AlertTypeValue) ? (value as AlertTypeValue) : "Other";
};

const normalizeStatus = (value?: string): AlertHistoryStatus => {
  return value === "scheduled" ? "scheduled" : "published";
};

const toBackendAlertType = (value: AlertTypeValue): string => ALERT_TYPE_TO_BACKEND[value];

const extractAlertList = (responseData: unknown): BackendAlert[] => {
  if (Array.isArray(responseData)) {
    return responseData as BackendAlert[];
  }

  if (!responseData || typeof responseData !== "object") {
    return [];
  }

  const payload = responseData as Record<string, unknown>;
  const nestedData = payload.data as unknown;

  if (Array.isArray(nestedData)) {
    return nestedData as BackendAlert[];
  }

  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    if (Array.isArray(nestedRecord.alerts)) {
      return nestedRecord.alerts as BackendAlert[];
    }
  }

  if (Array.isArray(payload.alerts)) {
    return payload.alerts as BackendAlert[];
  }

  return [];
};

const mapBackendAlert = (item: BackendAlert): AlertHistoryItem => {
  const id = item.id ?? item._id ?? item.alertId ?? Date.now();
  function formatAltId(rawId: unknown, prefix = "ALT", width = 4): string {
    if (rawId === null || rawId === undefined) return `${prefix}${"0".repeat(width)}`;
    const s = String(rawId).trim();
    const m = s.match(/(\d+)$/);
    const digits = m ? m[1] : s.replace(/\D/g, "");
    if (digits) return `${prefix}${digits.padStart(width, "0")}`;
    return s;
  }
  const displayId = formatAltId(id);
  const createdBy = normalizeCreatedBy(item);

  return {
    id,
    displayId,
    title: item.title ?? "Untitled Alert",
    description: item.description ?? "",
    type: normalizeAlertType(item.alertType ?? item.type),
    status: normalizeStatus(item.status),
    targetAudience: item.targetAudience ?? (item.targetRoute ? `Route ${item.targetRoute}` : "All Passengers"),
    affectedRoute: item.affectedRoute ?? item.route ?? "",
    affectedBus: item.affectedBus ?? item.busNumber ?? "",
    timestamp: item.timestamp ?? item.createdAt ?? new Date().toISOString(),
    scheduledAt: item.scheduledAt,
    sentAt: item.sentAt,
    createdBy,
  };
};

export default function AdminAlertsPage() {
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [alertType, setAlertType] = useState<AlertTypeValue>("Service-Distruption");
  const [affectedRoute, setAffectedRoute] = useState("");
  const [affectedBus, setAffectedBus] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetRoute, setTargetRoute] = useState("");
  const [isPublicAlert, setIsPublicAlert] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [selectedHistoryAlert, setSelectedHistoryAlert] = useState<AlertHistoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAlertType, setFilterAlertType] = useState("");
  const [filterAffectedRoute, setFilterAffectedRoute] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<string | number | null>(null);
  const [routes, setRoutes] = useState<Array<{ id: number; routeName: string; from?: string; to?: string; routeNumber?: string }>>([]);
  const [buses, setBuses] = useState<Array<{ id?: number | string; busNumber?: string }>>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});

  function formatRouteLabel(route: { routeName: string; from?: string; to?: string; routeNumber?: string }) {
    const fromTo = [route.from, route.to].filter(Boolean).join(" - ");

    if (route.routeName && route.routeName.trim() !== "") {
      return fromTo ? `${route.routeName} — ${fromTo}` : route.routeName;
    }

    const parts = [route.routeNumber].filter(Boolean);
    if (fromTo) {
      parts.push(fromTo);
    }

    return parts.join(" ").trim() || `Route ${route.routeNumber ?? ""}`.trim();
  }

  const routeFilterOptions = Array.from(
    new Map(
      routes
        .map((route) => ({
          value: String(route.routeNumber ?? route.routeName ?? route.id),
          label: formatRouteLabel(route),
        }))
        .filter((route) => route.value.trim() !== "")
        .map((route) => [route.value, route] as const),
    ).values(),
  );

  const busOptions = Array.from(
    new Map(
      buses
        .map((bus) => ({ value: String(bus.busNumber ?? bus.id ?? ""), label: String(bus.busNumber ?? bus.id ?? "") }))
        .filter((b) => b.value.trim() !== "")
        .map((b) => [b.value, b] as const),
    ).values(),
  );

  // Use server-side filtering/pagination. `alertHistory` already contains the
  // current page of results returned by the backend using the applied filters.
  // We avoid additional client-side filtering so totals and pages reflect the
  // full filtered dataset coming from the server.
  const filteredAlerts = alertHistory;

  const safePage = Math.min(page, totalPages);
  const availableRouteIds = new Set(routes.map((route) => String(route.id)));
  const createAlertFormSchema = buildCreateAlertFormSchema(availableRouteIds);

  const createAlertValidation = createAlertFormSchema.safeParse({
    alertType,
    affectedRoute,
    affectedBus,
    alertTitle,
    description,
    isPublicAlert,
    targetRoute,
  });

  const canSubmit = createAlertValidation.success;

  const previewStyle = ALERT_STYLE_MAP[alertType];
  const selectedAlertLabel = ALERT_LABEL_MAP[alertType];

  const resetCreateForm = () => {
    setAlertType("Service-Distruption");
    setAffectedRoute("");
    setAffectedBus("");
    setAlertTitle("");
    setDescription("");
    setTargetRoute("");
    setIsPublicAlert(false);
    setScheduleAt("");
    setCreateFormErrors({});
  };

  const fetchAlertHistory = useCallback(
    async (opts?: { search?: string; signal?: AbortSignal }) => {
      try {
        setHistoryLoading(true);

        const params: Record<string, unknown> = { page, limit };
        if (opts?.search) params.search = opts.search;
        if (filterStatus) params.status = filterStatus === "published" ? "sent" : filterStatus;
        if (filterAlertType) params.alertType = toBackendAlertType(filterAlertType as AlertTypeValue);
        if (filterAffectedRoute) params.affectedRoute = filterAffectedRoute;

        const response = await api.get(`/alerts/history/all`, {
          ...getAuthConfig(),
          params,
          signal: opts?.signal,
        } as any);

        const payload = response.data?.data ?? response.data;
        const alerts = extractAlertList(payload?.alerts ?? payload).map(mapBackendAlert);
        setAlertHistory(alerts);
        setTotalPages(payload?.totalPages ?? 1);
        setTotalAlerts(payload?.total ?? alerts.length);
      } catch (error) {
        // Ignore abort errors
        const isAbort = (error as any)?.name === "CanceledError" || (error as any)?.message === "canceled";
        if (!isAbort) {
          toast.error("Failed to load alert history");
          setAlertHistory([]);
          setTotalPages(1);
          setTotalAlerts(0);
        }
      } finally {
        setHistoryLoading(false);
      }
    },
    [page, limit, filterStatus, filterAlertType, filterAffectedRoute]
  );

  const validateCreateAlertForm = () => {
    const parsed = createAlertFormSchema.safeParse({
      alertType,
      affectedRoute,
      affectedBus,
      alertTitle,
      description,
      isPublicAlert,
      targetRoute,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "form");
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      });

      setCreateFormErrors(nextErrors);
      toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields");
      return null;
    }

    setCreateFormErrors({});
    return parsed.data;
  };

  const submitAlert = async (status: AlertHistoryStatus, scheduledAtIso?: string) => {
    const formData = validateCreateAlertForm();
    if (!formData) {
      return;
    }

    try {
      setSubmitting(true);
      const targetRouteId = formData.isPublicAlert ? null : Number(formData.targetRoute);
      const payload: Record<string, unknown> = {
        title: formData.alertTitle,
        description: formData.description,
        alertType: toBackendAlertType(formData.alertType as AlertTypeValue),
        targetAudience: formData.isPublicAlert ? "public" : "route",
        targetRoute: Number.isFinite(targetRouteId) ? targetRouteId : null,
        affectedRoute: formData.affectedRoute,
        affectedBus: formData.affectedBus,
      };

      if (status === "scheduled" && scheduledAtIso) {
        payload.status = "scheduled";
        payload.scheduledAt = scheduledAtIso;
      } else {
        payload.status = "sent";
      }

      await api.post("/alerts", payload, getAuthConfig());
      toast.success(status === "published" ? "Alert published successfully" : "Alert scheduled");
      await fetchAlertHistory();
      resetCreateForm();
      setShowSchedule(false);
      setShowCreatePage(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | { message?: string; errors?: Array<{ msg?: string; message?: string }> }
          | undefined;

        const fieldError = responseData?.errors?.[0]?.msg ?? responseData?.errors?.[0]?.message;
        const message = responseData?.message ?? fieldError;

        toast.error(message ? `Failed to save alert: ${message}` : "Failed to save alert");
      } else {
        toast.error("Failed to save alert");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAlert = async () => {
    await submitAlert("published");
  };

  const handleOpenSchedule = () => {
    const formData = validateCreateAlertForm();
    if (!formData) {
      return;
    }

    setShowSchedule(true);
  };

  const handleConfirmSchedule = async () => {
    const date = new Date(scheduleAt);
    if (Number.isNaN(date.getTime())) {
      toast.error("Invalid date/time");
      return;
    }

    await submitAlert("scheduled", date.toISOString());
  };

  const handleViewAlert = async (item: AlertHistoryItem) => {
    const id = item.id;
    setDetailLoadingId(id);

    try {
      const response = await api.get(`/alerts/${id}`, getAuthConfig());
      const detailsPayload = response.data as Record<string, unknown>;
      const data = detailsPayload?.data as unknown;

      if (data && !Array.isArray(data) && typeof data === "object") {
        setSelectedHistoryAlert(mapBackendAlert(mergeAlertDetail(item, data as BackendAlert)));
      } else {
        setSelectedHistoryAlert(item);
      }
    } catch {
      toast.error("Failed to load alert details");
      setSelectedHistoryAlert(item);
    } finally {
      setDetailLoadingId(null);
    }
  };

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const response = await api.get("/routes", {
          ...getAuthConfig(),
          params: { limit: 200 },
        });
        const data = response.data?.data?.routes ?? response.data?.routes ?? response.data?.data ?? [];
        const normalizedRoutes = Array.isArray(data)
          ? data
              .map((route: BackendRoute) => ({
                id: Number(route.id ?? 0),
                routeName: route.routeName ?? "",
                from: route.from,
                to: route.to,
                routeNumber: route.routeNumber,
              }))
              .filter((route) => route.id > 0)
          : [];
        setRoutes(normalizedRoutes);
      } catch {
        toast.error("Failed to load routes");
      }
    };

    loadRoutes();

    const loadBuses = async () => {
      try {
        const response = await api.get("/buses", {
          ...getAuthConfig(),
          params: { limit: 500 },
        });
        const data = response.data?.data?.buses ?? response.data?.buses ?? response.data?.data ?? [];
        const normalizedBuses = Array.isArray(data)
          ? data
              .map((b: any) => ({ id: b.id ?? b._id ?? b.busId ?? b.busNumber ?? null, busNumber: b.busNumber ?? b.number ?? b.registration ?? String(b.id ?? "") }))
              .filter((b) => b.id !== null)
          : [];
        setBuses(normalizedBuses);
      } catch {
        // ignore if buses endpoint is not available
      }
    };

    loadBuses();
  }, [fetchAlertHistory]);

  // Debounced search + cancel previous requests when typing
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchAlertHistory({ search: searchTerm.trim() || undefined, signal: controller.signal });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, page, limit, filterStatus, filterAlertType, filterAffectedRoute, fetchAlertHistory]);

  // Reset to first page when user starts a new search
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Reset to first page when filters change so we fetch the filtered dataset
  useEffect(() => {
    setPage(1);
    // Immediately fetch the filtered results for page 1. We don't pass a
    // signal here because this is a quick request triggered by a UI change.
    void fetchAlertHistory({ search: searchTerm.trim() || undefined });
  }, [filterAlertType, filterAffectedRoute, filterStatus]);

  return (
    <>
      <section className="p-6">
        {!showCreatePage ? (
          <>
            <div className="rounded-xl border border-gray-100 mb-4 ">
              <div className="flex flex-wrap items-center gap-3 ">
                <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm ">
                  <FaMagnifyingGlass className="w-5 h-5 opacity-50" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search title, description, or route..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none text-black"
                  />
                </div>
                
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
                  {routeFilterOptions.map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label}
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="overflow-x-auto md:overflow-x-visible">
                <div className="min-w-max md:min-w-full">
                  <div className="grid grid-cols-[70px_90px_90px_90px_160px_100px_100px_80px_60px] md:grid-cols-[90px_1.1fr_1fr_1fr_1.4fr_1.1fr_1fr_110px_70px] bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-700 border-b uppercase">
                    <div className="whitespace-nowrap">Alert ID</div>
                    <div>Type</div>
                    <div className="truncate md:whitespace-normal md:overflow-visible">Affected Bus</div>
                    <div className="truncate md:whitespace-normal md:overflow-visible">Affected Route</div>
                    <div className="overflow-hidden whitespace-nowrap truncate">Title</div>
                    <div>Target Audience</div>
                    <div>Created By</div>
                    <div>Status</div>
                    <div className="text-center">Action</div>
                  </div>
                  {historyLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500">Loading alerts...</div>
                  ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((item) => (
                      <div key={item.id} className="grid grid-cols-[70px_90px_90px_90px_160px_100px_100px_80px_60px] md:grid-cols-[90px_1.1fr_1fr_1fr_1.4fr_1.1fr_1fr_110px_70px] items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
                        <div className="font-semibold text-[#122843] whitespace-nowrap">{highlightText(String(item.displayId ?? item.id), searchTerm)}</div>
                        <div className="font-medium text-gray-700">{ALERT_LABEL_MAP[item.type]}</div>
                        <div className="text-gray-600 truncate md:whitespace-normal md:overflow-visible">{item.affectedBus ? highlightText(item.affectedBus, searchTerm) : "—"}</div>
                        <div className="text-gray-600 truncate md:whitespace-normal md:overflow-visible">{item.affectedRoute ? highlightText(item.affectedRoute, searchTerm) : "—"}</div>
                        <div className="text-gray-600 overflow-hidden whitespace-nowrap truncate">{highlightText(item.title, searchTerm)}</div>
                        <div className="text-gray-600">{item.targetAudience}</div>
                        <div className="text-gray-600">{item.createdBy?.role || formatCreatedBySummary(item.createdBy)}</div>
                        <div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${item.status === "published" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                            {item.status === "published" ? "Published" : "Scheduled"}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          <button disabled={detailLoadingId === item.id} onClick={() => handleViewAlert(item)} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed" title={detailLoadingId === item.id ? "Loading details..." : "View details"}>
                            <FaEye className="text-blue-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">No alerts found</div>
                  )}
                </div>
              </div>
            </div>

            {!historyLoading && totalAlerts > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm text-gray-600">
                  Showing {(safePage - 1) * limit + 1} to {Math.min(safePage * limit, totalAlerts)} of {totalAlerts} alerts
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={safePage <= 1}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`min-w-9 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          pageNumber === safePage
                            ? "bg-[#4CAF8A] text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </button>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Create New Alert</h2>
              <button
                onClick={() => setShowCreatePage(false)}
                className="h-10 bg-gray-300 text-gray-700 font-semibold px-6 rounded-lg hover:bg-gray-400 transition shadow-md"
              >
                Back
              </button>
            </div>

            <p className="mb-3 text-xs text-gray-500">Fields marked with <span className="text-red-600">*</span> are mandatory.</p>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Alert Type <span className="text-red-600">*</span></label>
                <select className="w-full h-10 border rounded-md border-[#828282]/70 px-2" value={alertType} onChange={(e) => setAlertType(e.target.value as AlertTypeValue)}>
                  {ALERT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold">Affected Route</label>
                <select
                  value={affectedRoute}
                  onChange={(e) => setAffectedRoute(e.target.value)}
                  className={`w-full h-10 border rounded-md px-2 ${createFormErrors.affectedRoute ? "border-red-500" : "border-[#828282]/70"}`}
                >
                  <option value="">Select affected route</option>
                  {routeFilterOptions.map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label}
                    </option>
                  ))}
                </select>
                {createFormErrors.affectedRoute && <p className="mt-1 text-xs text-red-600">{createFormErrors.affectedRoute}</p>}
              </div>

              <div>
                <label className="block mb-2 font-semibold">Affected Bus</label>
                <input
                  type="text"
                  className="w-full h-10 border rounded-md border-[#828282]/70 px-2"
                  placeholder="Enter affected bus number"
                  value={affectedBus}
                  onChange={(e) => setAffectedBus(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Alert Title <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  className={`w-full h-10 border rounded-md px-2 ${createFormErrors.alertTitle ? "border-red-500" : "border-[#828282]/70"}`}
                  placeholder="Enter a concise title for the alert"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                />
                {createFormErrors.alertTitle && <p className="mt-1 text-xs text-red-600">{createFormErrors.alertTitle}</p>}
              </div>

              <div>
                <label className="block mb-2 font-semibold">Description <span className="text-red-600">*</span></label>
                <textarea
                  className={`w-full h-32 border rounded-md px-2 py-1 ${createFormErrors.description ? "border-red-500" : "border-[#828282]/70"}`}
                  placeholder="Enter detailed description of the alert"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                {createFormErrors.description && <p className="mt-1 text-xs text-red-600">{createFormErrors.description}</p>}
              </div>

              <div>
                <label className="block mb-2 font-semibold">Target Audience <span className="text-red-600">*</span></label>
                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <select
                    className={`h-10 w-full md:w-64 border rounded-md px-2 ${createFormErrors.targetRoute ? "border-red-500" : "border-[#828282]/70"}`}
                    value={targetRoute}
                    onChange={(e) => {
                      setTargetRoute(e.target.value);
                      if (e.target.value) setIsPublicAlert(false);
                    }}
                    disabled={isPublicAlert}
                  >
                      <option value="">Select Route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={String(route.id)}>
                        {formatRouteLabel(route)}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <input id="public-alert" type="checkbox" className="h-5 w-5 rounded border-gray-300 text-blue-500" checked={isPublicAlert} disabled={targetRoute !== ""} onChange={(e) => { setIsPublicAlert(e.target.checked); if (e.target.checked) setTargetRoute(""); }} />
                    <label htmlFor="public-alert" className="font-semibold text-slate-700 whitespace-nowrap">Public Alert</label>
                  </div>
                </div>
                {createFormErrors.targetRoute && <p className="mt-1 text-xs text-red-600">{createFormErrors.targetRoute}</p>}
                {isPublicAlert && !targetRoute && (
                  <p className="mt-1 text-xs text-red-600">Public Alert selected — route selection is disabled.</p>
                )}
                {!isPublicAlert && targetRoute && (
                  <p className="mt-1 text-xs text-red-600">A route is selected — Public Alert is disabled.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex w-full sm:w-auto gap-3">
                <button className="flex-1 sm:flex-none bg-yellow-500 px-4 py-2 rounded-md text-white hover:bg-yellow-600" onClick={() => setShowPreview(true)}>
                  Preview
                </button>
                <button
                  disabled={submitting}
                  onClick={handleOpenSchedule}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-white ${canSubmit ? "bg-green-500 hover:bg-green-600" : "bg-green-500/80 hover:bg-green-500"} disabled:cursor-not-allowed disabled:bg-blue-400`}
                >
                  Schedule
                </button>
              </div>

              <div className="flex w-full sm:w-auto">
                <button
                  disabled={submitting}
                  className={`w-full text-white font-semibold px-6 h-10 rounded-lg transition shadow-md ${canSubmit ? "bg-[#4CAF8A] hover:bg-[#3d9e7a]" : "bg-[#4CAF8A]/80 hover:bg-[#4CAF8A]"} disabled:cursor-not-allowed disabled:bg-gray-400`}
                  onClick={handleCreateAlert}
                >
                  {submitting ? "Saving..." : "Create Alert"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <AlertHistoryViewModal item={selectedHistoryAlert} onClose={() => setSelectedHistoryAlert(null)} />

      <AlertPreviewModal open={showPreview} onClose={() => setShowPreview(false)} previewCardClass={previewStyle.cardClass} selectedAlertLabel={selectedAlertLabel} affectedRoute={affectedRoute} affectedBus={affectedBus} alertTitle={alertTitle} description={description} isPublicAlert={isPublicAlert} targetRoute={targetRoute} />

      <AlertScheduleModal open={showSchedule} scheduleAt={scheduleAt} onScheduleAtChange={setScheduleAt} onCancel={() => setShowSchedule(false)} onConfirm={handleConfirmSchedule} />
    </>
  );
}
