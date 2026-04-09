"use client";

import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import toast from "react-hot-toast";
import {
	ALERT_LABEL_MAP,
	ALERT_STYLE_MAP,
	ALERT_TYPE_OPTIONS,
	AlertTypeValue,
} from "@/config/alertTypes";

type AlertHistoryStatus = "published" | "scheduled";

type AlertHistoryItem = {
	id: number;
	title: string;
	type: AlertTypeValue;
	status: AlertHistoryStatus;
	targetAudience: string;
	affectedRoute: string;
	timestamp: string;
	scheduledAt?: string;
};

const initialAlertHistory: AlertHistoryItem[] = [];

export default function AdminAlertsPage() {
	const [alertType, setAlertType] = useState<AlertTypeValue>("Service-Distruption");
	const [affectedRoute, setAffectedRoute] = useState("");
	const [alertTitle, setAlertTitle] = useState("");
	const [description, setDescription] = useState("");
	const [targetRoute, setTargetRoute] = useState("");
	const [isPublicAlert, setIsPublicAlert] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [showSchedule, setShowSchedule] = useState(false);
	const [scheduleAt, setScheduleAt] = useState("");
	const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>(initialAlertHistory);
	const canSubmit =
		alertType.trim() !== "" &&
		affectedRoute.trim() !== "" &&
		alertTitle.trim() !== "" &&
		description.trim() !== "" &&
		(isPublicAlert || targetRoute.trim() !== "");
	const previewStyle = ALERT_STYLE_MAP[alertType];
	const selectedAlertLabel = ALERT_LABEL_MAP[alertType];
	const getTargetAudience = () => (isPublicAlert ? "All Passengers" : targetRoute);

	const addHistoryItem = (status: AlertHistoryStatus, scheduledAt?: string) => {
		setAlertHistory((currentHistory) => [
			{
				id: Date.now(),
				title: alertTitle,
				type: alertType,
				status,
				targetAudience: getTargetAudience(),
				affectedRoute,
				timestamp: new Date().toISOString(),
				scheduledAt,
			},
			...currentHistory,
		]);
	};

	useEffect(() => {
		const promoteScheduledAlerts = () => {
			const now = Date.now();
			setAlertHistory((currentHistory) => {
				let changed = false;
				const nextHistory = currentHistory.map((item) => {
					if (item.status !== "scheduled" || !item.scheduledAt) {
						return item;
					}

					const scheduledAtMs = Date.parse(item.scheduledAt);
					if (Number.isNaN(scheduledAtMs) || scheduledAtMs > now) {
						return item;
					}

					changed = true;
					return {
						...item,
						status: "published" as AlertHistoryStatus,
						timestamp: new Date().toISOString(),
					};
				});

				return changed ? nextHistory : currentHistory;
			});
		};

		promoteScheduledAlerts();
		const timerId = window.setInterval(() => {
			promoteScheduledAlerts();
		}, 30000);

		return () => {
			window.clearInterval(timerId);
		};
	}, []);

	return (
		<>
		<section className=" flex space-y-2  gap-5 p-6">
			<div className="bg-white rounded-md shadow p-4 w-180">
				<h2 className="text-xl font-bold mb-4">Create New Alert</h2>
				<label className="block mb-5 font-semibold">Alert Type:</label>
				<select 
					className="h-10 border rounded-md border-[#828282]/70 px-2"
					value={alertType}
					onChange={(e) => setAlertType(e.target.value as AlertTypeValue)}
				>
					{ALERT_TYPE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<label className="block mb-5 mt-5 font-semibold">Affected Route/Bus:</label>
				<input
					type="text"
					className="w-80 h-10 border rounded-md border-[#828282]/70 px-2"
					placeholder="Enter affected route or bus number"
					value={affectedRoute}
					onChange={(e) => setAffectedRoute(e.target.value)}
				/>
				<label className="block mb-5 mt-5 font-semibold">Alert Title:</label>
				<input
					type="text"
					className="w-150 h-10 border rounded-md border-[#828282]/70 px-2"
					placeholder="Enter a concise title for the alert"
					value={alertTitle}
					onChange={(e) => setAlertTitle(e.target.value)}
				/>
				<label className="block mb-5 mt-5 font-semibold">Description:</label>
				<textarea
					className="w-full h-24 border rounded-md border-[#828282]/70 px-2 py-1"
					placeholder="Enter detailed description of the alert"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				></textarea>
				<label className="block mb-5 mt-5 font-semibold">Target Audience:</label>
				<div className="flex items-end gap-1">
					<div className="flex-1">
						<select 
							className="h-10 w-50 border rounded-md border-[#828282]/70 px-2"
							value={targetRoute}
							onChange={(e) => {
								setTargetRoute(e.target.value);
								if (e.target.value) {
									setIsPublicAlert(false);
								}
							}}
							disabled={isPublicAlert}
						>
							<option value="" disabled>Select a route</option>
							<option value="100">100 Panadura - Pettah</option>
							<option value="101">101 Moratuwa - Pettah</option>
							<option value="102">102 Moratuwa - Kotahena</option>
							<option value="103">103 Narahenpita - Fort</option>
						</select>
					</div>
					<div className="flex items-center gap-2 mr-90">
						<input
							type="checkbox"
							id="public-alert"
							className="h-5 w-5 rounded border-gray-300 text-blue-500"
							checked={isPublicAlert}
							disabled={targetRoute !== ""}
							onChange={(e) => {
								setIsPublicAlert(e.target.checked);
								if (e.target.checked) {
									setTargetRoute("");
								}
							}}
						/>
						<label htmlFor="public-alert" className="font-semibold text-slate-700 whitespace-nowrap">
							Public Alert
							
						</label>
					</div>
				</div>
				<div>
					<p className="mt-3 text-sm font-medium text-gray-600">* If "Public Alert" is checked, the alert will be sent to all passengers. Otherwise, it will only be sent to passengers of the selected route.</p>
				</div>
				
				<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-3">
						<button 
							className="bg-yellow-500 px-4 py-2 rounded-md text-white hover:bg-yellow-600"
							onClick={() => setShowPreview(true)}
						>
							Preview
						</button>
						<button 
							disabled={!canSubmit}
							onClick={() => setShowSchedule(true)}
							className="bg-green-500 px-4 py-2 rounded-md text-white hover:bg-green-600 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400">
							Schedule
						</button>
					</div>
					<div className="flex flex-wrap justify-end gap-3">
						<button className="bg-gray-500 px-4 py-2 rounded-md text-white hover:bg-gray-600">
							Cancel
						</button>
						<button
							disabled={!canSubmit}
							className="bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400"
							onClick={() => {
								addHistoryItem("published");
								toast.success("Alert published successfully");
							}}
						>
							Create Alert
						</button>
					</div>
				</div>
			</div>
			<div className="bg-white rounded-md shadow p-4 w-85">
				<h3 className="mb-4 text-lg font-bold text-gray-800">History</h3>
				<div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
					{alertHistory.map((item) => (
						<div key={item.id} className={`rounded-md border-l-4 p-3 shadow-sm ${ALERT_STYLE_MAP[item.type].cardClass}`}>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-gray-800">{item.title}</p>
									<p className="text-xs text-gray-500">{ALERT_LABEL_MAP[item.type]}</p>
								</div>
								<span
									className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${
										item.status === "published"
											? "border-emerald-300 bg-emerald-100 text-emerald-700"
											: "border-amber-300 bg-amber-100 text-amber-700"
									}`}
								>
									{item.status}
								</span>
							</div>
							<p className="mt-2 text-xs text-gray-600">Target: {item.targetAudience}</p>
							<p className="mt-1 text-xs text-gray-600">Affected Route: {item.affectedRoute}</p>
							{item.scheduledAt && (
								<p className="mt-1 text-xs text-gray-600">Scheduled for: {item.scheduledAt}</p>
							)}
							<p className="mt-1 text-xs text-gray-500">{item.timestamp}</p>
						</div>
					))}
				</div>
			</div>
		</section>

		{/* if showPreview is true, show the preview modal */}
		{showPreview && (
			<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
				<div className="relative bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
					<button
						type="button"
						aria-label="Close preview"
						className="absolute right-4 top-4 text-2xl text-red-500 hover:text-white hover:bg-red-500 border border-red-500 rounded-full p-1 m2-"
						onClick={() => setShowPreview(false)}
					>
						<FaXmark />
					</button>
					<h2 className="text-xl font-bold mb-6">Alert Preview</h2>
					
					<div className="space-y-4 mb-6">
						<div className={`border-l-4 p-4 rounded ${previewStyle.cardClass}`}>
							<p className="text-sm text-gray-600 break-words"><strong>Alert Type:</strong> {selectedAlertLabel}</p>
							<p className="text-sm text-gray-600 mt-2 break-words"><strong>Affected Route/Bus:</strong> {affectedRoute || "N/A"}</p>
							<p className="text-base font-bold text-gray-700 mt-3 break-words">{alertTitle || "(No title entered)"}</p>
							<p className="text-gray-700 mt-3 whitespace-pre-wrap break-words">{description || "(No description entered)"}</p>
							<p className="text-sm text-gray-600 mt-4 break-words"><strong>Target Audience:</strong> {isPublicAlert ? "All Passengers" : (targetRoute || "Not selected")}</p>
						</div>
					</div>
					
				</div>
			</div>
		)}

		{showSchedule && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
				<div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg mx-4">
					
					<h3 className="mb-4 text-lg font-bold">Schedule Alert</h3>
					<label className="mb-2 block text-sm font-semibold">Select Date and time</label>
					<input
						type="datetime-local"
						value={scheduleAt}
						onChange={(e) => setScheduleAt(e.target.value)}
						className="h-10 w-full rounded-md border border-[#828282]  px-2"
					/>
					<div className="mt-5 flex justify-end gap-3">
						<button
							type="button"
							className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
							onClick={() => setShowSchedule(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={scheduleAt.trim() === ""}
							className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
							onClick={() => {
								const date = new Date(scheduleAt);
								if (Number.isNaN(date.getTime())) {
									toast.error("Invalid date/time");
									return;
								}

								addHistoryItem("scheduled", date.toISOString());
								toast.success("Alert scheduled");
								setShowSchedule(false);
							}}
						>
							Confirm Schedule
						</button>
					</div>
				</div>
			</div>
		)}

		</>
	);
}
