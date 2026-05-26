"use client";

import { useEffect, useState } from "react";

type ApiTrip = {
  id: number | string;
  tripNumber?: number;
  routeName?: string;
  direction?: string;
  departureTime?: string;
  arrivalTime?: string;
  displayStatus?: string;
  status?: string;
  statusLabel?: string;
  nextStatusLabel?: string;
  isActive?: boolean;
};

type TripStop = {
  sequence?: number;
  stopId?: number | string;
  stopName?: string;
  latitude?: number;
  longitude?: number;
  scheduledTime?: string;
  status?: string;
  estimatedArrival?: string;
};

type TodayTripsResponse = {
  busId?: number | string;
  registrationNumber?: string;
  todayDay?: string;
  trips?: ApiTrip[];
};

type TripStopsResponse = {
  tripId?: number | string;
  tripNumber?: number | string;
  routeName?: string;
  direction?: string;
  departureTime?: string;
  arrivalTime?: string;
  currentStatus?: string;
  statusLabel?: string;
  stops?: TripStop[];
};

type UpdateTripStatusResponse = {
  status?: string;
  statusLabel?: string;
  trip?: ApiTrip;
};

const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  return apiUrl.replace(/\/+$/, "");
};

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
};

const formatTime = (value?: string) => {
  if (!value) return "—";

  const trimmed = value.trim();
  if (trimmed === "") return "—";

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmed;

  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${String(normalizedHours).padStart(2, "0")}:${minutes} ${period}`;
};

type TripDisplayStatus = "scheduled" | "active" | "ongoing" | "completed";

const getTripDisplayStatus = (
  trip: Pick<ApiTrip, "displayStatus" | "status" | "statusLabel" | "nextStatusLabel" | "isActive"> | Pick<TripStopsResponse, "currentStatus" | "statusLabel">,
): TripDisplayStatus => {
  const statusSource = "displayStatus" in trip
    ? trip.displayStatus ?? trip.statusLabel ?? trip.status
    : "currentStatus" in trip
    ? trip.currentStatus ?? trip.statusLabel
    : trip.statusLabel;

  const normalized = statusSource?.trim().toLowerCase();

  if (normalized === "finished" || normalized === "completed" || normalized === "done") {
    return "completed";
  }

  if (normalized === "ongoing" || normalized === "active") {
    return normalized;
  }

  if (normalized === "scheduled" || normalized === "upcoming" || normalized === "start") {
    return "scheduled";
  }

  return "isActive" in trip && trip.isActive ? "active" : "scheduled";
};

const toBackendStatus = (value: "active" | "finished") => value;

const getNextStatus = (displayStatus: TripDisplayStatus): "active" | "finished" => {
  if (displayStatus === "completed") {
    return "finished";
  }

  if (displayStatus === "active" || displayStatus === "ongoing") {
    return "finished";
  }

  return "active";
};

const normalizeUpdateResponse = (payload: unknown): UpdateTripStatusResponse => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const record = payload as { data?: UpdateTripStatusResponse } & UpdateTripStatusResponse;
  return record.data ?? record;
};

export default function DriverSchedulePage() {
  const [busData, setBusData] = useState<TodayTripsResponse | null>(null);
  const [tripStopsInfo, setTripStopsInfo] = useState<TripStopsResponse | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stopsError, setStopsError] = useState("");
  const [updatingTripId, setUpdatingTripId] = useState<number | string | null>(null);

  const activeTrip = busData?.trips?.find((trip) => getTripDisplayStatus(trip) === "ongoing" || getTripDisplayStatus(trip) === "active");

  const activeTripId = activeTrip?.id;

  const handleUpdateTripStatus = async (trip: ApiTrip) => {
    const currentStatus = getTripDisplayStatus(trip);
    const nextStatus = getNextStatus(currentStatus);

    try {
      setUpdatingTripId(trip.id);

      const response = await fetch(`${getApiBaseUrl()}/bus-trips/${trip.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: toBackendStatus(nextStatus) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const payload = normalizeUpdateResponse(await response.json());
      const updatedTrip = payload.trip;
      const resolvedStatus = getTripDisplayStatus({
        displayStatus: updatedTrip?.displayStatus ?? payload.statusLabel ?? payload.status ?? nextStatus,
        status: updatedTrip?.status,
        statusLabel: updatedTrip?.statusLabel ?? payload.statusLabel,
        nextStatusLabel: updatedTrip?.nextStatusLabel,
        isActive: updatedTrip?.isActive ?? nextStatus !== "finished",
      });

      setBusData((prev) => {
        if (!prev?.trips?.length) return prev;

        const nextTrips = prev.trips.map((rowTrip) => {
          if (String(rowTrip.id) !== String(trip.id)) return rowTrip;

          return {
            ...rowTrip,
            ...updatedTrip,
            displayStatus: updatedTrip?.displayStatus ?? payload.statusLabel ?? payload.status ?? resolvedStatus,
            status: payload.status ?? payload.statusLabel ?? updatedTrip?.status ?? nextStatus,
            statusLabel: payload.statusLabel ?? updatedTrip?.statusLabel ?? updatedTrip?.displayStatus ?? resolvedStatus,
            nextStatusLabel: updatedTrip?.nextStatusLabel ?? (resolvedStatus === "completed" ? "" : resolvedStatus === "active" || resolvedStatus === "ongoing" ? "Finished" : "Start"),
            isActive: resolvedStatus === "active" || resolvedStatus === "ongoing",
          };
        });

        return {
          ...prev,
          trips: nextTrips,
        };
      });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update trip status";
      setError(message);
    } finally {
      setUpdatingTripId(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadTodayTrips = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${getApiBaseUrl()}/bus-trips/today`, {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as { data?: TodayTripsResponse } | TodayTripsResponse;
        setBusData((payload as { data?: TodayTripsResponse })?.data ?? (payload as TodayTripsResponse));
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError("Failed to load today's trips");
          setBusData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTodayTrips();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!activeTripId) {
      setStops([]);
      setStopsError("");
      return;
    }

    const controller = new AbortController();

    const loadTripStops = async () => {
      try {
        setStopsLoading(true);
        setStopsError("");

        const response = await fetch(`${getApiBaseUrl()}/bus-trips/${activeTripId}/stops`, {
          method: "GET",
          cache: "no-store",
          headers: {
            ...getAuthHeaders(),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as { data?: TripStopsResponse } | TripStopsResponse;
        const tripInfo = (payload as { data?: TripStopsResponse })?.data ?? (payload as TripStopsResponse);
        const tripStops = tripInfo?.stops ?? [];

        setTripStopsInfo(tripInfo ?? null);
        setStops(Array.isArray(tripStops) ? tripStops : []);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setStopsError("Failed to load trip stops");
          setStops([]);
          setTripStopsInfo(null);
        }
      } finally {
        setStopsLoading(false);
      }
    };

    loadTripStops();

    return () => controller.abort();
  }, [activeTripId]);

  const trips = busData?.trips ?? [];
  const registrationNumber = busData?.registrationNumber ?? "—";
  const todayDay = busData?.todayDay ?? "Today";
  const currentTripSummary = tripStopsInfo ?? activeTrip ?? null;
  const currentTripDisplayStatus = currentTripSummary ? getTripDisplayStatus(currentTripSummary) : null;
  const currentTripNumber = tripStopsInfo?.tripNumber ?? activeTrip?.tripNumber ?? activeTrip?.id ?? tripStopsInfo?.tripId ?? null;
  const activeTripLabel = currentTripSummary
    ? `${currentTripNumber ?? "—"} - ${currentTripSummary.routeName ?? activeTrip?.routeName ?? "Trip"}`
    : "No ongoing trip";

  return (
    <section className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bus-trip-table-wrap lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="bus-trip-header border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-4 py-3.5">
          <h2 className="text-base font-semibold text-slate-800">
            Bus {registrationNumber} - {todayDay} Trips
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Live schedule loaded from the backend bus-trips endpoint.
          </p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">Loading today's trips...</div>
          ) : error ? (
            <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
          ) : trips.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">No trips found for today.</div>
          ) : (
            <table className="w-full min-w-175 border-collapse text-[13px]">
              <thead className="bg-slate-900 text-slate-100">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">Trip</th>
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">Route</th>
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">Direction</th>
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">Departure</th>
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">Arrival</th>
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">Status</th>
                  <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px] text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {trips.map((trip, index) => {
                  const displayStatus = getTripDisplayStatus(trip);
                  const isCompleted = displayStatus === "completed";
                  const isRunning = displayStatus === "active" || displayStatus === "ongoing";
                  const buttonLabel = trip.nextStatusLabel ?? (isRunning ? "Finished" : "Start");
                  const badgeLabel = trip.displayStatus ?? trip.statusLabel ?? trip.status ?? (isCompleted ? "completed" : isRunning ? "ongoing" : "scheduled");

                  return (
                    <tr
                      key={trip.id}
                      className={`bus-trip-row border-b border-slate-100 transition-colors hover:bg-sky-50/70 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-[11px] font-semibold text-white shadow-sm">
                          {String(trip.tripNumber ?? index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="bus-trip-direction px-4 py-3 font-medium text-slate-800">
                        {trip.routeName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{trip.direction ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{formatTime(trip.departureTime)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatTime(trip.arrivalTime)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-sm ${
                            isCompleted
                              ? "bg-blue-700"
                              : isRunning
                              ? "bg-amber-500"
                              : "bg-emerald-600"
                          }`}
                        >
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={updatingTripId === trip.id || isCompleted}
                          onClick={() => void handleUpdateTripStatus(trip)}
                          className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingTripId === trip.id
                            ? "Updating..."
                            : isCompleted
                            ? "Completed"
                            : buttonLabel}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bus-trip-timeline rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:justify-self-end lg:w-full lg:max-w-100.5">
        <h3 className="mb-2 text-xs font-semibold text-slate-800">Current Trip Stops</h3>

        <div className="mb-3 space-y-3 text-sm text-slate-600">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bus</p>
            <p className="font-medium text-slate-800">{registrationNumber}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Day</p>
            <p className="font-medium text-slate-800">{todayDay}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trip</p>
            <p className="font-medium text-slate-800">{activeTripLabel}</p>
          </div>
        </div>

        {!currentTripDisplayStatus || (currentTripDisplayStatus !== "ongoing" && currentTripDisplayStatus !== "active") ? (
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
            Stops appear when a trip is started and disappear after it is finished.
          </div>
        ) : stopsLoading ? (
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">Loading stops...</div>
        ) : stopsError ? (
          <div className="rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-600">{stopsError}</div>
        ) : stops.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">No stops available for this trip.</div>
        ) : (
          <div className="space-y-2">
            {stops.map((stop) => (
              <div key={`${stop.stopId ?? stop.sequence ?? stop.stopName}`} className="flex items-start gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-50">
                <div className="flex flex-col items-center pt-0.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      stop.status?.trim().toLowerCase() === "current" ? "bg-blue-600" : stop.status?.trim().toLowerCase() === "departed" ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  />
                  <div className="h-5 w-px bg-gray-300" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-medium ${stop.status?.trim().toLowerCase() === "current" ? "text-blue-600" : "text-gray-600"}`}>
                    {stop.stopName ?? "Stop"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {stop.status === "departed"
                      ? "Departed"
                      : stop.status === "current"
                      ? "Now"
                      : stop.estimatedArrival || stop.scheduledTime || "Scheduled"}
                  </p>
                </div>

                <div className="pt-0.5 text-right text-[8px] font-semibold uppercase tracking-wide text-gray-400">
                  {String(stop.sequence ?? "").padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
