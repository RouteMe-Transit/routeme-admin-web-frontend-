// This file defines the alert types and their associated styles for the application. It includes a list of alert types, a mapping of alert types to their corresponding badge and card styles, and a mapping of alert types to their display labels.
export const ALERT_TYPE_OPTIONS = [
	{ value: "Service-Distruption", label: "Service Distruption" },
	{ value: "Road-Block", label: "Road Block" },
	{ value: "Delay", label: "Delay" },
	{ value: "Accident", label: "Accident" },
	{ value: "Breakdown", label: "Breakdown" },
	{ value: "Weather", label: "Weather" },
	{ value: "Not-Operating", label: "Not Operating" },
	{ value: "Heavy-Rain", label: "Heavy Rain" },
	{ value: "Damaged-Roads", label: "Damaged Roads" },
	{ value: "Rule-Enforcement", label: "Rule Enforcement" },
	{ value: "New-Bus-Stop", label: "New Bus Stop Added" },
	{ value: "Removed-Bus-Stop", label: "Bus Stop Removed" },
	{ value: "Route-Change", label: "Bus Route Change" },
	{ value: "Public-Events", label: "Public Events" },
	{ value: "Other", label: "Other" },
] as const;

export type AlertTypeValue = (typeof ALERT_TYPE_OPTIONS)[number]["value"];// This creates a union type of all the 'value' properties from the ALERT_TYPE_OPTIONS array, ensuring type safety when using alert types throughout the application.

export const ALERT_STYLE_MAP: Record<AlertTypeValue, { badgeClass: string; cardClass: string }> = {
	"Service-Distruption": {
		badgeClass: "border-red-300 bg-white text-red-700",
		cardClass: "border-l-red-500 bg-white",
	},
	"Road-Block": {
		badgeClass: "border-rose-300 bg-rose-100 text-rose-700",
		cardClass: "border-l-rose-500 bg-white",
	},
	Delay: {
		badgeClass: "border-orange-300 bg-orange-100 text-orange-700",
		cardClass: "border-l-orange-500 bg-white",
	},
	Accident: {
		badgeClass: "border-amber-300 bg-amber-100 text-amber-800",
		cardClass: "border-l-amber-500 bg-white",
	},
	Breakdown: {
		badgeClass: "border-red-300 bg-red-100 text-red-700",
		cardClass: "border-l-red-500 bg-white",
	},
	Weather: {
		badgeClass: "border-blue-300 bg-blue-100 text-blue-700",
		cardClass: "border-l-blue-500 bg-white",
	},
	"Not-Operating": {
		badgeClass: "border-slate-300 bg-slate-200 text-slate-800",
		cardClass: "border-l-slate-600 bg-white",
	},
	"Heavy-Rain": {
		badgeClass: "border-cyan-300 bg-cyan-100 text-cyan-700",
		cardClass: "border-l-cyan-500 bg-white",
	},
	"Damaged-Roads": {
		badgeClass: "border-rose-300 bg-rose-100 text-rose-700",
		cardClass: "border-l-rose-500 bg-white",
	},
	"Rule-Enforcement": {
		badgeClass: "border-violet-300 bg-violet-100 text-violet-700",
		cardClass: "border-l-violet-500 bg-white",
	},
	"New-Bus-Stop": {
		badgeClass: "border-emerald-300 bg-emerald-100 text-emerald-700",
		cardClass: "border-l-emerald-500 bg-white",
	},
	"Removed-Bus-Stop": {
		badgeClass: "border-pink-300 bg-pink-100 text-pink-700",
		cardClass: "border-l-pink-500 bg-white",
	},
	"Route-Change": {
		badgeClass: "border-indigo-300 bg-indigo-100 text-indigo-700",
		cardClass: "border-l-indigo-500 bg-white",
	},
	"Public-Events": {
		badgeClass: "border-lime-300 bg-lime-100 text-lime-800",
		cardClass: "border-l-lime-500 bg-white",
	},
	Other: {
		badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
		cardClass: "border-l-slate-500 bg-white",
	},
};

export const ALERT_LABEL_MAP: Record<AlertTypeValue, string> = ALERT_TYPE_OPTIONS.reduce(
	(acc, option) => ({ ...acc, [option.value]: option.label }),
	{} as Record<AlertTypeValue, string>,
);
