"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BUS_ALERT_TYPES, type BusAlertType, sendBusAlertToPassengers } from "@/config/passengerAlerts";
import { ALERT_LABEL_MAP } from "@/config/alertTypes";
import { formatSriLankanTime } from "@/utils/sriLankanTime";

type SentAlertHistoryItem = {
    id: number;
    type: BusAlertType;
    label: string;
    time: string;
    route: string;
};


const ALERT_ICON_SRC_MAP: Record<BusAlertType, string> = {
    "Road-Block": "/icons/bus-roadblock.svg",
    Accident: "/icons/bus-accident.svg",
    Breakdown: "/icons/bus-breakdown.svg",
    Weather: "/icons/bus-weather.svg",
    Delay: "/icons/bus-delay.svg",
    "Not-Operating": "/icons/bus-notoperating.svg",
};

const ALERT_COLOR_MAP: Record<
    BusAlertType,
    {
        cardBorder: string;
        titleText: string;
        buttonBg: string;
        buttonHover: string;
        historyRow: string;
    }
> = {
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

export default function BusAlertsPage() {
    const [assignedRoute, setAssignedRoute] = useState("138");
    const [sentAlertsHistory, setSentAlertsHistory] = useState<SentAlertHistoryItem[]>([]);

    useEffect(() => {
        let isMounted = true;

        const loadAssignedRoute = async () => {
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                const response = await fetch(`${apiBaseUrl ?? ""}/api/bus/topbar-info`, {
                    cache: "no-store",
                });

                if (!response.ok) return;

                const data = (await response.json()) as { routeNumber?: string };
                if (!isMounted) return;

                setAssignedRoute(data.routeNumber ?? "138");
            } catch {
                // Keep the default route when API is unavailable.
            }
        };

        loadAssignedRoute();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSendAlert = (type: BusAlertType) => {
        const label = ALERT_LABEL_MAP[type];
        const routeLabel = `Route ${assignedRoute}`;
        sendBusAlertToPassengers(type, routeLabel);
        toast.success(`${label} alert sent`);

        const newHistoryItem: SentAlertHistoryItem = {
            id: Date.now(),
            type,
            label,
            time: formatSriLankanTime(),
            route: routeLabel,
        };

        setSentAlertsHistory((prev) => [newHistoryItem, ...prev].slice(0, 8));
    };

    return (
        <section className="space-y-6">
            <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BUS_ALERT_TYPES.map((type) => {
                    const label = ALERT_LABEL_MAP[type];
                    const iconSrc = ALERT_ICON_SRC_MAP[type];
                    const color = ALERT_COLOR_MAP[type];

                    return (
                        <article
                            key={type}
                            className={`flex h-[216.891px] w-[293.069px] flex-col rounded-2xl border bg-[#FFFFFF] p-4 shadow-sm transition hover:shadow-md ${color.cardBorder}`}
                        >
                            <h3 className={`w-full text-center text-base font-bold ${color.titleText}`}>{label}</h3>

                            <div className="flex flex-1 items-center justify-center">
                                <img src={iconSrc} alt={label} className="h-14 w-14 object-contain" />
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSendAlert(type)}
                                className={`mx-auto h-[30.663px] w-[145.377px] rounded-xl text-sm font-bold text-[#4B5563] transition ${color.buttonBg} ${color.buttonHover}`}
                            >
                                Send Alert
                            </button>
                        </article>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-[#828282]">Recent Alerts</h2>

                {sentAlertsHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No alerts sent yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {sentAlertsHistory.map((item) => (
                            <li
                                key={item.id}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${ALERT_COLOR_MAP[item.type].historyRow}`}
                            >
                                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <img
                                        src={ALERT_ICON_SRC_MAP[item.type]}
                                        alt={item.label}
                                        className="h-5 w-5 object-contain"
                                    />
                                    {item.label}
                                </span>
                                <span className="text-xs text-gray-500">{item.route} • {item.time}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </section>
    );
}