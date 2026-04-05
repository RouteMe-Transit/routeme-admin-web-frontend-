// This file defines the structure and sample data for passenger alerts in the application. It also includes a utility function to count unread alerts.
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP, AlertTypeValue } from "@/config/alertTypes";

export const PASSENGER_ALERTS_CHANGED_EVENT = "passenger-alerts-changed";

export type PassengerAlert = {
	id: number;
	type: AlertTypeValue;
	title: string;
	description: string;
	affectedRoute: string;
	time: string;
	isUnread: boolean;
};

export const passengerAlerts: PassengerAlert[] = [
	{
		id: 1,
		type: "Delay",
		title: "Peak-hour congestion near Fort",
		description: "Expect 15-20 minute delays due to city-wide traffic restrictions.",
		affectedRoute: "101 Moratuwa - Pettah",
		time: "10 minutes ago",
		isUnread: true,
	},
	{
		id: 2,
		type: "Weather",
		title: "Flood warning around low-level roads",
		description: "Buses are taking alternate roads in flood-prone sections until rain eases.",
		affectedRoute: "100 Panadura - Pettah",
		time: "25 minutes ago",
		isUnread: true,
	},
	{
		id: 3,
		type: "Route-Change",
		title: "Temporary route diversion",
		description: "Route 102 has a temporary diversion due to road maintenance.",
		affectedRoute: "102 Moratuwa - Kotahena",
		time: "1 hour ago",
		isUnread: false,
	},
];

export function getPassengerUnreadAlertCount(alerts: PassengerAlert[] = passengerAlerts) {
	return alerts.filter((alert) => alert.isUnread).length;
}

export function markAllPassengerAlertsAsRead() {
	let changed = false;
	for (const alert of passengerAlerts) {
		if (alert.isUnread) {
			alert.isUnread = false;
			changed = true;
		}
	}

	if (changed) {
		window.dispatchEvent(new Event(PASSENGER_ALERTS_CHANGED_EVENT));
	}
}

export { ALERT_LABEL_MAP, ALERT_STYLE_MAP };
