const SRI_LANKA_TIMEZONE = "Asia/Colombo";

type DateInput = Date | string | number;

function toValidDate(input: DateInput): Date {
	const date = input instanceof Date ? input : new Date(input);
	if (Number.isNaN(date.getTime())) {
		throw new Error("Invalid date input provided to formatSriLankanTime");
	}
	return date;
}

export function formatSriLankanTime(input: DateInput = new Date()): string {
	const date = toValidDate(input);
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: SRI_LANKA_TIMEZONE,
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).formatToParts(date);

	const hour = parts.find((part) => part.type === "hour")?.value ?? "12";
	const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
	const dayPeriod = (parts.find((part) => part.type === "dayPeriod")?.value ?? "AM").toUpperCase();

	return `${hour}.${minute}${dayPeriod}`;
}

export { SRI_LANKA_TIMEZONE };
