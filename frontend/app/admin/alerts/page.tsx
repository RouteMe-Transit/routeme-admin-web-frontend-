"use client";

import { useState } from "react";
import { FaXmark } from "react-icons/fa6";

export default function AdminAlertsPage() {
	const [alertType, setAlertType] = useState("Service-Distruption");
	const [affectedRoute, setAffectedRoute] = useState("");
	const [alertTitle, setAlertTitle] = useState("");
	const [description, setDescription] = useState("");
	const [targetRoute, setTargetRoute] = useState("");
	const [isPublicAlert, setIsPublicAlert] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [showSchedule, setShowSchedule] = useState(false);
	const [scheduleAt, setScheduleAt] = useState("");
	const [scheduledMessage, setScheduledMessage] = useState("");
	const canSubmit =
		alertType.trim() !== "" &&
		affectedRoute.trim() !== "" &&
		alertTitle.trim() !== "" &&
		description.trim() !== "" &&
		(isPublicAlert || targetRoute.trim() !== "");

	return (
		<>
		<section className="space-y-2">
			<div className="bg-white rounded-md shadow p-4 w-200">
				<h2 className="text-xl font-bold mb-4">Create New Alert</h2>
				<label className="block mb-5 font-semibold">Alert Type:</label>
				<select 
					className="h-10 border rounded-md border-[#828282]/70 px-2"
					value={alertType}
					onChange={(e) => setAlertType(e.target.value)}
				>
					<option value="Service-Distruption">Service Distruption</option>
					<option value="Delay">City-Wide Traffic Restrictions</option>
					<option value="Accident">Security Alerts</option>
					<option value="Weather">Flood-Prone Routes Warning</option>
					<option value="Other">Heavy Rain</option>
					<option value="Other">Damaged Roads</option>
					<option value="Other">Rule Enforcement</option>
					<option value="Other">New Bus Stop Added</option>
					<option value="Other">Bus Stop Removed</option>
					<option value="Other">Bus Route Change</option>
					<option value="Other">Public Events</option>
					<option value="Other">Other</option>
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
							Shedule
						</button>
					</div>
					<div className="flex flex-wrap justify-end gap-3">
						<button className="bg-gray-500 px-4 py-2 rounded-md text-white hover:bg-gray-600">
							Cancel
						</button>
						<button
							disabled={!canSubmit}
							className="bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400"
						>
							Create Alert
						</button>
					</div>
				</div>
			</div>
		</section>

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
						<div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
							<p className="text-sm text-gray-600 break-words"><strong>Alert Type:</strong> {alertType}</p>
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
					<button
						type="button"
						aria-label="Close schedule"
						className="absolute right-3 top-3 text-xl text-red-500 hover:text-red-700"
						onClick={() => setShowSchedule(false)}
					>
						<FaXmark />
					</button>
					<h3 className="mb-4 text-lg font-bold">Schedule Alert</h3>
					<label className="mb-2 block text-sm font-semibold">Date and time</label>
					<input
						type="datetime-local"
						value={scheduleAt}
						onChange={(e) => setScheduleAt(e.target.value)}
						className="h-10 w-full rounded-md border border-[#828282]/70 px-2"
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
								setScheduledMessage(`Alert scheduled for ${scheduleAt}`);
								setShowSchedule(false);
							}}
						>
							Confirm Schedule
						</button>
					</div>
				</div>
			</div>
		)}

		{scheduledMessage && (
			<p className="mt-3 px-2 text-sm font-medium text-green-700">{scheduledMessage}</p>
		)}
		</>
	);
}
