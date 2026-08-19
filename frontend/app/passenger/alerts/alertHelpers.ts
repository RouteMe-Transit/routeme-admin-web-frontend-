//this file contains helper functions for passenger alerts, including mapping backend alert data to frontend structures, formatting times, and extracting alert details.
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP, type AlertTypeValue } from "@/config/alertTypes";
import { formatSriLankanTime } from "@/utils/sriLankanTime";

export type BackendAlert = {
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

export type PassengerFeedAlert = {
	id: string;
	displayId?: string;
	type: AlertTypeValue;
	title: string;
	description: string;
	affectedRoute: string;
	time: string;
	isUnread: boolean;
};

export type PassengerAlertDetail = {
	id?: string | number;
	title?: string;
	alertType?: string;
	affectedBus?: string;
	affectedRoute?: string;
	sentAt?: string;
	description?: string;
};

export const DEFAULT_FEED_LIMIT = 50;

export function getAuthConfig() {
	const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

	return {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	};
}

export function normalizeAlertType(value?: string): AlertTypeValue {
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
	if (rawId === null || rawId === undefined) {
		return `${prefix}${"0".repeat(width)}`;
	}

	const value = String(rawId).trim();
	const match = value.match(/(\d+)$/);
	const digits = match ? match[1] : value.replace(/\D/g, "");

	if (digits) {
		return `${prefix}${digits.padStart(width, "0")}`;
	}

	return value;
}

export function extractAlertList(payload: unknown): BackendAlert[] {
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

export function mapBackendAlert(alert: BackendAlert): PassengerFeedAlert {
	const alertId = alert.id ?? alert._id ?? alert.alertId ?? `${alert.title ?? "alert"}-${alert.createdAt ?? alert.sentAt ?? Date.now()}`;
	const isUnread = alert.isUnread ?? (typeof alert.isRead === "boolean" ? !alert.isRead : !alert.readAt);

	return {
		id: String(alertId),
		displayId: formatAltId(alertId),
		type: normalizeAlertType(alert.alertType ?? alert.type),
		title: alert.title?.trim() || "Untitled alert",
		description: alert.description?.trim() || "No description available.",
		affectedRoute: alert.affectedRoute?.trim() || alert.route?.trim() || "N/A",
		time: formatAlertTime(alert),
		isUnread,
	};
}

export function extractPassengerAlertDetail(payload: unknown): PassengerAlertDetail | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const record = payload as Record<string, unknown>;

	if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
		return record.data as PassengerAlertDetail;
	}

	return record as PassengerAlertDetail;
}

export function formatDetailTime(value?: string): string {
	if (!value) {
		return "Not provided";
	}

	try {
		return formatSriLankanTime(value);
	} catch {
		return value;
}
}

export function prefixTruncateWords(value: string | undefined, maxWords = 6) {
	const text = String(value ?? "").trim();
	if (!text) {
		return "";
	}

	const words = text.split(/\s+/);
	if (words.length <= maxWords) {
		return text;
	}

	return `${words.slice(0, maxWords).join(" ")}...`;
}

export function getAlertStyle(alertType?: string) {
	const resolvedType = normalizeAlertType(alertType);
	const detailStyle = ALERT_STYLE_MAP[resolvedType];

	return {
		type: resolvedType,
		label: ALERT_LABEL_MAP[resolvedType],
		style: detailStyle,
		fullBorderClass: (() => {
			const value = String(detailStyle.cardClass ?? "");
			const leftMatch = value.match(/border-l-([^\s]+)/);
			const anyMatch = value.match(/border-([^\s]+)/);
			const colorToken = leftMatch?.[1] ?? anyMatch?.[1] ?? null;
			const bgToken = value.match(/bg-[^\s]+/)?.[0] ?? "bg-white";

			if (colorToken) {
				return `${bgToken} border-4 border-${colorToken}`;
			}

			return value;
		})(),
	};
}