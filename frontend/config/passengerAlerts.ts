// This file defines the structure and sample data for passenger alerts in the application. It also includes a utility function to count unread alerts.
//shared by passenger, bus driver interfaces and sidebar. so stay in config folder.
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP, AlertTypeValue } from "@/config/alertTypes";

export const PASSENGER_ALERTS_CHANGED_EVENT = "passenger-alerts-changed";
export const PASSENGER_ALERTS_SEEN_IDS_STORAGE_KEY = "passenger-alert-feed-seen-ids";

export type PassengerAlert = {
	id: number;
	type: AlertTypeValue;
	title: string;
	description: string;
	affectedRoute: string;
	time: string;
	isUnread: boolean;
};

function dispatchPassengerAlertsChanged() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(PASSENGER_ALERTS_CHANGED_EVENT));
	}
}

export function getSeenPassengerAlertIds() {
	if (typeof window === "undefined") {
		return new Set<string>();
	}

	try {
		const rawValue = window.sessionStorage.getItem(PASSENGER_ALERTS_SEEN_IDS_STORAGE_KEY);
		const parsed = rawValue ? (JSON.parse(rawValue) as unknown) : [];

		if (!Array.isArray(parsed)) {
			return new Set<string>();
		}

		return new Set(parsed.filter((id): id is string => typeof id === "string"));
	} catch {
		return new Set<string>();
	}
}

export function markPassengerAlertsAsSeen(alertIds: string[]) {
	if (typeof window !== "undefined") {
		try {
			window.sessionStorage.setItem(PASSENGER_ALERTS_SEEN_IDS_STORAGE_KEY, JSON.stringify(alertIds));
		} catch {
			// Ignore storage failures and fall back to in-memory updates.
		}
	}

	dispatchPassengerAlertsChanged();
}

export const BUS_ALERT_TYPES = [
	"Delay",
	"Weather",
	"Breakdown",
	"Not-Operating",
	"Accident",
	"Road-Block",
] as const;

export type BusAlertType = (typeof BUS_ALERT_TYPES)[number];

const BUS_ALERT_TEMPLATE_MAP: Record<BusAlertType, { title: string; description: string }> = {
	"Road-Block": {
		title: "Road block on active route",
		description: "A road block has been reported. The bus is using an alternate path where possible.",
	},
	Accident: {
		title: "Accident reported ahead",
		description: "An accident is affecting normal movement. Please expect temporary disruption.",
	},
	Breakdown: {
		title: "Bus breakdown reported",
		description: "The bus has a technical issue and operations are delayed until support arrives.",
	},
	Weather: {
		title: "Weather alert on your route",
		description: "Adverse weather is affecting bus movement. Please allow extra travel time.",
	},
	Delay: {
		title: "Service delay notice",
		description: "The current trip is delayed due to route conditions and traffic congestion.",
	},
	"Not-Operating": {
		title: "Bus not operating",
		description: "This bus is currently not operating. Please use the next available service.",
	},
};

export function sendBusAlertToPassengers(type: BusAlertType, affectedRoute: string) {
	const template = BUS_ALERT_TEMPLATE_MAP[type];
	const nextId = passengerAlerts.length > 0 ? Math.max(...passengerAlerts.map((alert) => alert.id)) + 1 : 1;

	passengerAlerts.unshift({
		id: nextId,
		type,
		title: template.title,
		description: template.description,
		affectedRoute,
		time: "Just now",
		isUnread: true,
	});

	window.dispatchEvent(new Event(PASSENGER_ALERTS_CHANGED_EVENT));
}

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
		dispatchPassengerAlertsChanged();
	}
}

export { ALERT_LABEL_MAP, ALERT_STYLE_MAP };
