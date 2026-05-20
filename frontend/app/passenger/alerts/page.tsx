"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaXmark } from "react-icons/fa6";
import api from "../../services/api";
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP } from "../../../config/alertTypes";
import { getSeenPassengerAlertIds, markPassengerAlertsAsSeen } from "../../../config/passengerAlerts";
import { formatSriLankanTime } from "../../../utils/sriLankanTime";
import type { AlertTypeValue } from "../../../config/alertTypes";

type BackendAlert = {
    id?: string | number;
    _id?: string;
    alertId?: string | number;
    title?: string;
    description?: string;
    type?: string;
    alertType?: string;
    affectedRoute?: string;
    route?: string;
    createdAt?: string;
    sentAt?: string;
    timestamp?: string;
    readAt?: string;
    isUnread?: boolean;
    isRead?: boolean;
};

type PassengerFeedAlert = {
    id: string;
    displayId?: string;
    type: AlertTypeValue;
    title: string;
    description: string;
    affectedRoute: string;
    time: string;
    isUnread: boolean;
};

type PassengerAlertDetail = {
    id?: string | number;
    title?: string;
    alertType?: string;
    affectedBus?: string;
    affectedRoute?: string;
    sentAt?: string;
    description?: string;
};

const DEFAULT_FEED_LIMIT = 50;

function getAuthConfig() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    return {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
}

function normalizeAlertType(value?: string): AlertTypeValue {
    if (!value) {
        return "Other";
    }

    const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, "-");

    const typeMap: Record<string, AlertTypeValue> = {
        delay: "Delay",
        accident: "Accident",
        breakdown: "Breakdown",
        weather: "Weather",
        "not-operating": "Not-Operating",
        "road-block": "Road-Block",
        "service-distruption": "Service-Distruption",
        "service-disruption": "Service-Distruption",
        "heavy-rain": "Heavy-Rain",
        "damaged-roads": "Damaged-Roads",
        "rule-enforcement": "Rule-Enforcement",
        "new-bus-stop": "New-Bus-Stop",
        "removed-bus-stop": "Removed-Bus-Stop",
        "route-change": "Route-Change",
        "public-events": "Public-Events",
        other: "Other",
    };

    return typeMap[normalized] ?? typeMap[normalized.replace(/-/g, " ")] ?? "Other";
}

function formatAlertTime(alert: BackendAlert): string {
    const sourceTime = alert.sentAt ?? alert.createdAt ?? alert.timestamp;

    if (!sourceTime) {
        return "Just now";
    }

    try {
        return formatSriLankanTime(sourceTime);
    } catch {
        return sourceTime;
    }
}

function formatAltId(rawId: unknown, prefix = "ALT", width = 4): string {
    if (rawId === null || rawId === undefined) return `${prefix}${"0".repeat(width)}`;
    const s = String(rawId).trim();
    const m = s.match(/(\d+)$/);
    const digits = m ? m[1] : s.replace(/\D/g, "");
    if (digits) return `${prefix}${digits.padStart(width, "0")}`;
    return s;
}

function extractAlertList(payload: unknown): BackendAlert[] {
    if (Array.isArray(payload)) {
        return payload as BackendAlert[];
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.alerts)) {
        return record.alerts as BackendAlert[];
    }

    if (record.data && typeof record.data === "object") {
        const nested = record.data as Record<string, unknown>;

        if (Array.isArray(nested.alerts)) {
            return nested.alerts as BackendAlert[];
        }

        if (Array.isArray(nested.data)) {
            return nested.data as BackendAlert[];
        }
    }

    return [];
}

function mapBackendAlert(alert: BackendAlert): PassengerFeedAlert {
    const alertId = alert.id ?? alert._id ?? alert.alertId ?? `${alert.title ?? "alert"}-${alert.createdAt ?? alert.sentAt ?? Date.now()}`;
    const isUnread = alert.isUnread ?? (typeof alert.isRead === "boolean" ? !alert.isRead : !alert.readAt);

    const displayId = formatAltId(alertId);

    return {
        id: String(alertId),
        displayId,
        type: normalizeAlertType(alert.alertType ?? alert.type),
        title: alert.title?.trim() || "Untitled alert",
        description: alert.description?.trim() || "No description available.",
        affectedRoute: alert.affectedRoute?.trim() || alert.route?.trim() || "N/A",
        time: formatAlertTime(alert),
        isUnread,
    };
}

function extractPassengerAlertDetail(payload: unknown): PassengerAlertDetail | null {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const record = payload as Record<string, unknown>;

    if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
        return record.data as PassengerAlertDetail;
    }

    return record as PassengerAlertDetail;
}

function formatDetailTime(value?: string): string {
    if (!value) {
        return "Not provided";
    }

    try {
        return formatSriLankanTime(value);
    } catch {
        return value;
    }
}

export default function PassengerAlertsPage() {
    const [alerts, setAlerts] = useState<PassengerFeedAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedAlert, setSelectedAlert] = useState<PassengerAlertDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const loadAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/alerts/feed", {
                ...getAuthConfig(),
                params: {
                    page: 1,
                    limit: DEFAULT_FEED_LIMIT,
                },
            });

            const payload = response.data?.data ?? response.data;
            const seenAlertIds = getSeenPassengerAlertIds();
            const feedAlerts = extractAlertList(payload).map(mapBackendAlert).map((alert) => ({
                ...alert,
                isUnread: alert.isUnread && !seenAlertIds.has(alert.id),
            }));

                    // Filter alerts so a newly-registered passenger only sees alerts
                    // created after their registration time. We look for common
                    // timestamp fields on the alert and for likely created/registered
                    // timestamp fields on the stored user object.
                    function getUserRegisteredAt(): Date | null {
                        try {
                            const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
                            if (!raw) return null;
                            const user = JSON.parse(raw) as Record<string, unknown>;

                            const candidates = [
                                "createdAt",
                                
                            ];

                            for (const k of candidates) {
                                const v = user[k];
                                if (typeof v === "string") {
                                    const d = Date.parse(v);
                                    if (!Number.isNaN(d)) return new Date(d);
                                }
                            }
                        } catch {
                            // ignore parse errors
                        }

                        return null;
                    }

                    function parseAlertCreatedAt(a: BackendAlert): Date | null {
                        const val = a.sentAt ?? a.createdAt ?? a.timestamp;
                        if (!val) return null;
                        const parsed = Date.parse(String(val));
                        return Number.isNaN(parsed) ? null : new Date(parsed);
                    }

                    const userRegisteredAt = getUserRegisteredAt();

                    const filtered = feedAlerts.filter((alert, idx) => {
                        if (!userRegisteredAt) return true; // no registration time -> don't filter
                        const raw = extractAlertList(payload)[idx];
                        const alertDate = parseAlertCreatedAt(raw as BackendAlert);
                        // Only include alerts that have a valid timestamp on or after registration
                        return alertDate !== null && alertDate >= userRegisteredAt;
                    });

                    setAlerts(filtered);
                    markPassengerAlertsAsSeen(filtered.map((alert) => alert.id));
        } catch {
            setAlerts([]);
            setError("Failed to load passenger alerts. Please try again.");
            toast.error("Failed to load passenger alerts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAlerts();
    }, [loadAlerts]);

    const openAlertDetail = useCallback(async (id: string) => {
        setSelectedAlert(null);
        setDetailError("");
        setDetailLoading(true);
                const modalBorderClass = `${detailStyle.fullBorderClass ?? "border-slate-500"} border-4`;

        try {
            const response = await api.get(`/alerts/${id}`, getAuthConfig());
            const detail = extractPassengerAlertDetail(response.data);

            if (!detail) {
                setDetailError("Alert details are not available.");
                return;
            }

            setSelectedAlert(detail);
        } catch (caughtError) {
            const status = (caughtError as { response?: { status?: number } })?.response?.status;

            if (status === 403) {
                setDetailError("You are not allowed to view this alert.");
            } else if (status === 404) {
                setDetailError("Alert not found.");
            } else {
                setDetailError("Failed to load alert details.");
                toast.error("Failed to load alert details");
            }
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const closeAlertDetail = useCallback(() => {
        setSelectedAlert(null);
        setDetailLoading(false);
        setDetailError("");
    }, []);

    const unreadCount = alerts.filter((alert) => alert.isUnread).length;
    const detailType = selectedAlert ? normalizeAlertType(selectedAlert.alertType) : "Other";
    const detailLabel = ALERT_LABEL_MAP[detailType];
    const detailStyle = ALERT_STYLE_MAP[detailType];
    const detailFullBorderClass = (() => {
        const s = String(detailStyle.cardClass ?? "");
        const leftMatch = s.match(/border-l-([^\s]+)/);
        const anyMatch = s.match(/border-([^\s]+)/);
        const colorToken = leftMatch?.[1] ?? anyMatch?.[1] ?? null;
        const bgToken = s.match(/bg-[^\s]+/)?.[0] ?? "bg-white";

        if (colorToken) {
            return `${bgToken} border-4 border-${colorToken}`;
        }

        // fallback to original class string
        return s;
    })();

    return (
        <section className="space-y-4 p-6">
            {unreadCount > 0 && (
                <div className="flex justify-end">
                    <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                        {unreadCount} unread
                    </span>
                </div>
            )}

            {loading ? (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
                    Loading alerts...
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 shadow-sm">
                    {error}
                </div>
            ) : alerts.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
                    No alerts available right now.
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => {
                        const style = ALERT_STYLE_MAP[alert.type];

                        return (
                            <button
                                key={alert.id}
                                type="button"
                                onClick={() => void openAlertDetail(alert.id)}
                                className={`w-full h-40 rounded-md border-l-4 p-4 text-left shadow-sm transition hover:shadow-md overflow-hidden ${style.cardClass}`}
                            >
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${style.badgeClass}`}>
                                        {ALERT_LABEL_MAP[alert.type]}
                                    </span>
                                    {alert.isUnread && (
                                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                                            New
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{alert.time}</span>
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-gray-800 truncate">{alert.title}</h3>
                                <div className="mt-1 pr-2">
                                    <p className="text-sm text-gray-700 wrap-break-word">{prefixTruncateWords(alert.description, 8)}</p>
                                </div>
                                <p className="mt-2 text-xs font-medium text-gray-600">Affected Route: {alert.affectedRoute}</p>
                            </button>
                        );
                    })}
                </div>
            )}

            {(detailLoading || detailError || selectedAlert) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-[28px] shadow-2xl ${detailFullBorderClass}`}>
                        <div className="px-5 py-5 pr-14 sm:pr-16">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    
                                    <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${detailStyle.badgeClass}`}>
                                                {detailLabel}
                                            </span>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                        {detailLoading ? "Loading..." : selectedAlert?.title ?? "Alert details"}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            {detailLoading ? (
                                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                    Loading alert details...
                                </div>
                            ) : detailError ? (
                                <div className="rounded-2xl bg-rose-50 px-4 py-10 text-center text-sm text-rose-700">
                                    {detailError}
                                </div>
                            ) : selectedAlert ? (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Affected Bus</p>
                                            <p className="mt-2 text-sm font-medium text-slate-800 wrap-break-word">{selectedAlert.affectedBus ?? "Not provided"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Affected Route</p>
                                            <p className="mt-2 text-sm font-medium text-slate-800 wrap-break-word">{selectedAlert.affectedRoute ?? "Not provided"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sent At</p>
                                            <p className="mt-2 text-sm font-medium text-slate-800 wrap-break-word">{formatDetailTime(selectedAlert.sentAt)}</p>
                                        </div>
                                    </div>

                                    <div className={`rounded-2xl bg-white px-4 py-4 shadow-sm sm:px-5`}>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Description</p>
                                        <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-800 sm:text-[17px]">
                                            {selectedAlert.description ?? "Not provided"}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={closeAlertDetail}
                            className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition hover:bg-white hover:text-rose-700 sm:absolute sm:right-6 sm:top-6"
                            aria-label="Close alert details"
                        >
                            <FaXmark className="text-lg" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

function prefixTruncateWords(value: string | undefined, maxWords = 6) {
    const s = String(value ?? "").trim();
    if (!s) return "";
    const words = s.split(/\s+/);
    if (words.length <= maxWords) return s;
    return `${words.slice(0, maxWords).join(" ")}...`;
}