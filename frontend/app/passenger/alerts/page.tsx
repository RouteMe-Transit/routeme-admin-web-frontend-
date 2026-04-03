"use client";

import { useEffect } from "react";
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP, passengerAlerts } from "@/config/passengerAlerts";
import { markAllPassengerAlertsAsRead } from "@/config/passengerAlerts";

export default function PassengerAlertsPage() {
    useEffect(() => {
        markAllPassengerAlertsAsRead();
    }, []);

    const unreadCount = passengerAlerts.filter((alert) => alert.isUnread).length;

    return (
        <section className="space-y-4">
            {unreadCount > 0 && (
                <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                    {unreadCount} unread
                </span>
            )}

            <div className="space-y-3">
                {passengerAlerts.map((alert) => {
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
        </section>
    );
}