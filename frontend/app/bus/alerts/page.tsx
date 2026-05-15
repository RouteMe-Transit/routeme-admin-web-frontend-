"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BUS_ALERT_TYPES, type BusAlertType } from "@/config/passengerAlerts";
import { ALERT_LABEL_MAP } from "@/config/alertTypes";
import { formatSriLankanTime } from "@/utils/sriLankanTime";
import BusAlertCard from "./BusAlertCard";

export type BusAlertHistoryItem = {
    id: number;
    title: string;
    type: BusAlertType | string;
    alertType?: string;
    description: string;
    targetAudience: string;
    createdAt: string;
    updatedAt: string;
    sentAt?: string | null;
};

const ALERT_ICON_SRC_MAP: Record<string, string> = {
    "Road-Block": "/icons/bus-roadblock.svg",
    Accident: "/icons/bus-accident.svg",
    Breakdown: "/icons/bus-breakdown.svg",
    Weather: "/icons/bus-weather.svg",
    Delay: "/icons/bus-delay.svg",
    "Not-Operating": "/icons/bus-notoperating.svg",
};

const ALERT_COLOR_MAP: Record<string, any> = {
    Delay: {
        cardBorder: "border-amber-300",
        titleText: "text-amber-700",
        buttonBg: "bg-amber-100",
        buttonHover: "hover:bg-amber-200",
        historyRow: "border-amber-200 bg-amber-50",
    },
    Weather: {
        cardBorder: "border-blue-300",
        titleText: "text-blue-700",
        buttonBg: "bg-blue-100",
        buttonHover: "hover:bg-blue-200",
        historyRow: "border-blue-200 bg-blue-50",
    },
    Breakdown: {
        cardBorder: "border-red-300",
        titleText: "text-red-700",
        buttonBg: "bg-red-100",
        buttonHover: "hover:bg-red-200",
        historyRow: "border-red-200 bg-red-50",
    },
    "Not-Operating": {
        cardBorder: "border-slate-300",
        titleText: "text-slate-700",
        buttonBg: "bg-slate-200",
        buttonHover: "hover:bg-slate-300",
        historyRow: "border-slate-200 bg-slate-100",
    },
    Accident: {
        cardBorder: "border-orange-300",
        titleText: "text-orange-700",
        buttonBg: "bg-orange-100",
        buttonHover: "hover:bg-orange-200",
        historyRow: "border-orange-200 bg-orange-50",
    },
    "Road-Block": {
        cardBorder: "border-rose-300",
        titleText: "text-rose-700",
        buttonBg: "bg-rose-100",
        buttonHover: "hover:bg-rose-200",
        historyRow: "border-rose-200 bg-rose-50",
    },
};

const FALLBACK_ALERT_COLOR = ALERT_COLOR_MAP.Delay;
const normalizeBusAlertType = (value?: string): BusAlertType => {
    if (!value) return "Delay";

    const normalized = value.trim().toLowerCase();

    if (normalized === "road-block" || normalized === "road block") return "Road-Block" as BusAlertType;
    if (normalized === "accident") return "Accident" as BusAlertType;
    if (normalized === "breakdown") return "Breakdown" as BusAlertType;
    if (normalized === "weather") return "Weather" as BusAlertType;
    if (normalized === "not-operating" || normalized === "not operating") return "Not-Operating" as BusAlertType;
    if (normalized === "delay") return "Delay" as BusAlertType;

    return "Delay" as BusAlertType;
};

const getAlertColor = (type?: string) => ALERT_COLOR_MAP[normalizeBusAlertType(type)] ?? FALLBACK_ALERT_COLOR;

const getBusRegNum = (data?: any) => data?.busRegNum?.trim() ?? "";

const getRouteTargetId = (data?: any) => {
    const candidate = data?.route?.id ?? data?.routeId;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
};

const getRouteAudienceValue = (data?: any) => String(data?.route?.id ?? data?.routeId ?? "");

const buildRouteName = (data?: any) => {
    const routeName = (data?.routeName && data.routeName.trim()) || (data?.route?.routeName && data.route.routeName.trim());
    return routeName ?? "";

};

const buildAlertDescription = (type: BusAlertType, busRegNum: string, routeName: string) => {
    const prefix = `${busRegNum} on route ${routeName}`;

    switch (type) {
        case "Not-Operating":
            return `${prefix} is currently not operating.`;
        case "Delay":
            return `${prefix} is currently delayed.`;
        case "Breakdown":
            return `${prefix} has experienced a breakdown.`;
        case "Accident":
            return `${prefix} has reported an accident.`;
        case "Weather":
            return `${prefix} is affected by severe weather conditions.`;
        case "Road-Block":
            return `${prefix} is affected due to a road block.`;
        default:
            return `${prefix} has a service disruption.`;
    }
};

const buildHistoryItem = (item: BusAlertHistoryItem) => {
    const historyType = normalizeBusAlertType(item.alertType ?? (item.type as string));
    const sentTime = item.sentAt ?? item.createdAt;

    return {
        ...item,
        type: historyType,
        alertType: item.alertType ?? (item.type as string),
        iconSrc: ALERT_ICON_SRC_MAP[historyType] ?? ALERT_ICON_SRC_MAP.Delay,
        time: formatSriLankanTime(new Date(sentTime)),
    } as any;
};

const getApiBaseUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
    return rawBaseUrl.replace(/\/+$/, "");
};

const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
};

async function sendBusAlert(
    type: BusAlertType,
    description: string,
    targetAudience: string,
    affectedBus: string,
    affectedRoute: string,
    targetRouteId?: number | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const parsedTargetRoute = Number(targetAudience);
        const targetRoute =
            typeof targetRouteId === "number" && Number.isFinite(targetRouteId)
                ? targetRouteId
                : Number.isFinite(parsedTargetRoute)
                    ? parsedTargetRoute
                    : null;

        const response = await fetch(`${getApiBaseUrl()}/alerts/bus/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({
                title: ALERT_LABEL_MAP[type],
                type,
                alertType: type,
                description,
                targetAudience: "route",
                targetRoute,
                affectedRoute,
                affectedBus,
            }),
        });

        if (!response.ok) {
            const responseText = await response.text();

            try {
                const errorData = JSON.parse(responseText) as { message?: string; errors?: Array<{ message?: string; msg?: string }> };
                const validationMessage = errorData.errors?.[0]?.message ?? errorData.errors?.[0]?.msg;
                return { success: false, error: errorData.message || validationMessage || "Failed to send alert" };
            } catch {
                return { success: false, error: responseText || "Failed to send alert" };
            }
        }

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Network error";
        return { success: false, error: message };
    }
}

async function fetchBusAlertHistory(): Promise<{
    data?: BusAlertHistoryItem[];
    error?: string;
}> {
    try {
        const response = await fetch(`${getApiBaseUrl()}/alerts/bus/history`, {
            method: "GET",
            cache: "no-store",
            headers: {
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const responseText = await response.text();

            try {
                const errorData = JSON.parse(responseText) as { message?: string };
                return { error: errorData.message || "Failed to fetch history" };
            } catch {
                return { error: responseText || "Failed to fetch history" };
            }
        }

        const payload = (await response.json()) as
            | BusAlertHistoryItem[]
            | { data?: BusAlertHistoryItem[]; alerts?: BusAlertHistoryItem[] }
            | { data?: { alerts?: BusAlertHistoryItem[] } };

        try {
            // eslint-disable-next-line no-console
            console.debug("[busAlerts] fetchBusAlertHistory payload:", payload);
        } catch (e) {
            // ignore logging failures
        }

        if (Array.isArray(payload)) {
            return { data: payload };
        }

        if (Array.isArray((payload as any).data)) {
            return { data: (payload as any).data };
        }

        if ((payload as any).data && Array.isArray((payload as any).data.alerts)) {
            return { data: (payload as any).data.alerts };
        }

        if (Array.isArray((payload as any).alerts)) {
            return { data: (payload as any).alerts };
        }

        return { data: [] };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Network error";
        return { error: message };
    }
}

type SentAlertHistoryItem = BusAlertHistoryItem & { 
    iconSrc: string;
    time: string;
};

type BusTopbarInfo = {
    busRegNum?: string;
    routeId?: number | string;
    routeName?: string;
    from?: string;
    to?: string;
    route?: {
        id?: number | string;
        routeNumber?: string;
        routeName?: string;
        from?: string;
        to?: string;
    };
};

export default function BusAlertsPage() {
    const [busRegNum, setBusRegNum] = useState("");
    const [routeName, setRouteName] = useState("");
    const [assignedRoute, setAssignedRoute] = useState("");
    const [targetRouteId, setTargetRouteId] = useState<number | null>(null);
    const [sentAlertsHistory, setSentAlertsHistory] = useState<SentAlertHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadAssignedRoute = async () => {
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
                
                const response = await fetch(`${apiBaseUrl.replace(/\/+$/, "")}/bus-trips/today`, {
                    cache: "no-store",
                    headers,
                });

                if (!response.ok) return;

                const data = (await response.json()) as any;

                const busData = data?.data ?? data;
                const firstTrip = busData?.trips?.[0] ?? null;
                if (!busData) return;

                const busTopbarInfo: BusTopbarInfo = {
                    busRegNum: busData?.registrationNumber ?? firstTrip?.bus?.registrationNumber,
                    routeId: firstTrip?.route?.id ?? firstTrip?.routeId,
                    routeName: firstTrip?.route?.routeName ?? firstTrip?.routeName,
                    from: firstTrip?.route?.from,
                    to: firstTrip?.route?.to,
                    route: firstTrip?.route ?? firstTrip,
                };
                
                if (!isMounted) return;

                setAssignedRoute(getRouteAudienceValue(busTopbarInfo));
                setTargetRouteId(getRouteTargetId(busTopbarInfo));
                setBusRegNum(getBusRegNum(busTopbarInfo));
                setRouteName(buildRouteName(busTopbarInfo));
            } catch (error) {
                // eslint-disable-next-line no-console
                console.debug("[busAlerts] Error loading assigned route:", error);
            }
        };

        const loadAlertHistory = async () => {
            try {
                const result = await fetchBusAlertHistory();
                if (!isMounted) return;

                if (result.data) {
                    const latestHistory = result.data
                        .map(buildHistoryItem)
                        .slice(0, 10);
                    setSentAlertsHistory(latestHistory);
                } else if (result.error) {
                    console.error("Failed to load alert history:", result.error);
                }
            } catch (error) {
                console.error("Error loading alert history:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadAssignedRoute();
        loadAlertHistory();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSendAlert = async (type: BusAlertType) => {
        const label = ALERT_LABEL_MAP[type];
        const description = buildAlertDescription(type, busRegNum, routeName);

        try {
            const result = await sendBusAlert(type, description, assignedRoute, busRegNum, routeName, targetRouteId);

            if (result.success) {
                toast.success(`${label} alert sent`);

                try {
                    const historyResult = await fetchBusAlertHistory();
                    // eslint-disable-next-line no-console
                    console.debug("[busAlerts] post-send historyResult:", historyResult);

                    if (historyResult.data) {
                        const latestHistory = historyResult.data
                            .map(buildHistoryItem)
                            .slice(0, 10);

                        setSentAlertsHistory(latestHistory);
                    }
                } catch (e) {
                    const newHistoryItem: SentAlertHistoryItem = {
                        id: Date.now(),
                        type: normalizeBusAlertType(type),
                        alertType: type,
                        title: ALERT_LABEL_MAP[type],
                        iconSrc: ALERT_ICON_SRC_MAP[type] ?? ALERT_ICON_SRC_MAP.Delay,
                        time: formatSriLankanTime(new Date()),
                        description,
                        targetAudience: assignedRoute,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        sentAt: new Date().toISOString(),
                    };

                    setSentAlertsHistory((prev) => [newHistoryItem, ...prev].slice(0, 10));
                }
            } else {
                toast.error(result.error || `Failed to send ${label} alert`);
            }
        } catch (error) {
            toast.error("An error occurred while sending the alert");
            console.error("Error sending alert:", error);
        }
    };

    return (
        <section className="space-y-6 p-6">
            <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
                {BUS_ALERT_TYPES.map((type) => {
                    const label = ALERT_LABEL_MAP[type];
                    const iconSrc = ALERT_ICON_SRC_MAP[type];
                    const color = ALERT_COLOR_MAP[type];

                    return (
                        <BusAlertCard
                            key={type}
                            type={type}
                            label={label}
                            iconSrc={iconSrc}
                            color={color}
                            onSend={handleSendAlert}
                        />
                    );
                })}
            </div>

            <div className="bus-alert-panel rounded-2xl border border-gray-200 bg-white p-4 shadow-sm w-255 ml-8">
                <h2 className="mb-2 text-lg font-bold text-[#828282]">Recent Alerts</h2>
                <h3 className="text-sm text-gray-500">Only the most recent alerts are shown here.</h3>

                {isLoading ? (
                    <p className="text-sm text-gray-500">Loading alert history...</p>
                ) : sentAlertsHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No alerts sent yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {sentAlertsHistory.map((item) => (
                            <li
                                key={item.id}
                                className={`bus-alert-history-item flex items-center justify-between rounded-lg border px-3 py-2 ${getAlertColor(item.type).historyRow}`}
                            >
                                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <img
                                        src={item.iconSrc}
                                        alt={ALERT_LABEL_MAP[item.type as BusAlertType]}
                                        className="h-5 w-5 object-contain"
                                    />
                                    {item.title}
                                </span>
                                <span className="text-xs text-gray-500">{item.time}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </section>
    );
}

