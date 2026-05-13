"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/app/services/api";
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP, getSeenPassengerAlertIds, markPassengerAlertsAsSeen } from "@/config/passengerAlerts";
import { formatSriLankanTime } from "@/utils/sriLankanTime";
import type { AlertTypeValue } from "@/config/alertTypes";

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
    type: AlertTypeValue;
    title: string;
    description: string;
    affectedRoute: string;
    time: string;
    isUnread: boolean;
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

    return {
        id: String(alertId),
        type: normalizeAlertType(alert.alertType ?? alert.type),
        title: alert.title?.trim() || "Untitled alert",
        description: alert.description?.trim() || "No description available.",
        affectedRoute: alert.affectedRoute?.trim() || alert.route?.trim() || "N/A",
        time: formatAlertTime(alert),
        isUnread,
    };
}

export default function PassengerAlertsPage() {
    const [alerts, setAlerts] = useState<PassengerFeedAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    const unreadCount = alerts.filter((alert) => alert.isUnread).length;

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
                            <div key={alert.id} className={`rounded-md border-l-4 p-4 shadow-sm ${style.cardClass}`}>
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${style.badgeClass}`}>
                                        {ALERT_LABEL_MAP[alert.type]}
                                    </span>
                                    {alert.isUnread && (
                                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                                            New
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">{alert.time}</span>
                                </div>
                                <h3 className="text-base font-bold text-gray-800">{alert.title}</h3>
                                <p className="mt-1 text-sm text-gray-700">{alert.description}</p>
                                <p className="mt-2 text-xs font-medium text-gray-600">Affected Route: {alert.affectedRoute}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}