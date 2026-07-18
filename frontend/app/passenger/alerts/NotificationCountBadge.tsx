//this file contains a React component that displays a notification badge with a count of alerts. It uses the "react-notification-badge" library to create a visually appealing badge that scales when the count changes. The component accepts props for the count, an optional label, additional CSS classes, and an ARIA label for accessibility. If the count is less than 1, the component returns null and does not render anything.
"use client";

import NotificationBadge, { Effect } from "react-notification-badge";

type Props = {
	count: number;
	label?: string;
	className?: string;
	ariaLabel?: string;
};

export default function NotificationCountBadge({ count, label, className = "", ariaLabel }: Props) {
	if (count < 1) {
		return null;
	}

	return (
		<div className={`inline-flex ${className}`} aria-label={ariaLabel}>
			<NotificationBadge
				count={count}
				label={label}
				effect={Effect.SCALE}
				duration={220}
				containerStyle={{ display: "inline-flex", lineHeight: 1 }}
				style={{
					backgroundColor: "#dc2626",
					borderRadius: "9999px",
					boxShadow: "0 2px 10px rgba(220, 38, 38, 0.35)",
					color: "#ffffff",
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "11px",
					fontWeight: 700,
					minWidth: "1.25rem",
					height: "1.25rem",
					padding: "0 0.4rem",
				}}
			/>
		</div>
	);
}