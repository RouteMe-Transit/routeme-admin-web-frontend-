"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSeenPassengerAlertIds, markPassengerAlertsAsSeen } from "../../../config/passengerAlerts";
import PassengerAlertCard from "./PassengerAlertCard";
import PassengerAlertDetailModal from "./PassengerAlertDetailModal";
import {
	DEFAULT_FEED_LIMIT,
	extractAlertList,
	extractPassengerAlertDetail,
	getAuthConfig,
	mapBackendAlert,
	type PassengerAlertDetail,
	type PassengerFeedAlert,
} from "./alertHelpers";

export default function PassengerAlertsPage() {
	const [alerts, setAlerts] = useState<PassengerFeedAlert[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedAlert, setSelectedAlert] = useState<PassengerAlertDetail | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState("");

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
			const visibleAlerts = extractAlertList(payload);
			const seenAlertIds = getSeenPassengerAlertIds();
			const feedAlerts = visibleAlerts.map(mapBackendAlert).map((alert) => ({
				...alert,
				isUnread: alert.isUnread && !seenAlertIds.has(alert.id),
			}));

			setAlerts(feedAlerts);
			markPassengerAlertsAsSeen(feedAlerts.map((alert) => alert.id));
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

	const openAlertDetail = useCallback(async (id: string) => {
		setSelectedAlert(null);
		setDetailError("");
		setDetailLoading(true);

		try {
			const response = await api.get(`/alerts/${id}`, getAuthConfig());
			const detail = extractPassengerAlertDetail(response.data);

			if (!detail) {
				setDetailError("Alert details are not available.");
				return;
			}

			setSelectedAlert(detail);
		} catch (caughtError) {
			const status = (caughtError as { response?: { status?: number } })?.response?.status;

			if (status === 403) {
				setDetailError("You are not allowed to view this alert.");
			} else if (status === 404) {
				setDetailError("Alert not found.");
			} else {
				setDetailError("Failed to load alert details.");
				toast.error("Failed to load alert details");
			}
		} finally {
			setDetailLoading(false);
		}
	}, []);

	const closeAlertDetail = useCallback(() => {
		setSelectedAlert(null);
		setDetailLoading(false);
		setDetailError("");
	}, []);

	return (
		<section className="space-y-4 p-6">
			{loading ? (
				<div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
					Loading alerts...
				</div>
			) : error ? (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 shadow-sm">{error}</div>
			) : alerts.length === 0 ? (
				<div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
					No alerts available right now.
				</div>
			) : (
				<div className="space-y-3">
					{alerts.map((alert) => (
						<PassengerAlertCard key={alert.id} alert={alert} onOpen={openAlertDetail} />
					))}
				</div>
			)}

			<PassengerAlertDetailModal
				alert={selectedAlert}
				loading={detailLoading}
				error={detailError}
				onClose={closeAlertDetail}
			/>
		</section>
	);
}