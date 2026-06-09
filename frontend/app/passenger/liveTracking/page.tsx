"use client";

import api from "@/app/services/api";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

type Bus = {
  id: string;
  routeName: string;
  from?: string;
  to?: string;
  heading?: string;
  type?: string;
  latitude: number;
  longitude: number;
  status?: "active" | "stale" | "inactive" | string;
  lastUpdated?: string;
  distanceKm?: number;
};

type LiveTrackingResponse = {
  buses: Bus[];
  pollingIntervalSeconds?: number;
};

type LocationPoint = {
  latitude: number;
  longitude: number;
};

const DEFAULT_POLLING_INTERVAL_SECONDS = 10;

const LiveTrackingMap = dynamic(() => import("@/app/passenger/liveTracking/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-125 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBus(raw: unknown, index: number): Bus | null {
  if (!isObject(raw)) {
    return null;
  }

  const location = isObject(raw.location) ? raw.location : null;
  const latitude = toNumber(raw.latitude ?? raw.lat ?? location?.latitude);
  const longitude = toNumber(raw.longitude ?? raw.lng ?? raw.lon ?? location?.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  const routeName =
    typeof raw.routeName === "string"
      ? raw.routeName
      : typeof raw.route === "string"
        ? raw.route
        : typeof raw.routeNumber === "string"
          ? raw.routeNumber
          : "Unknown route";

  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw.registrationNumber === "string"
        ? raw.registrationNumber
        : `bus-${index + 1}`;

  return {
    id,
    routeName,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    heading: typeof raw.heading === "string" ? raw.heading : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    latitude,
    longitude,
    status: typeof raw.status === "string" ? raw.status : undefined,
    lastUpdated: typeof raw.lastUpdated === "string" ? raw.lastUpdated : typeof raw.timestamp === "string" ? raw.timestamp : undefined,
    distanceKm: toNumber(raw.distanceKm ?? raw.distance_km ?? raw.distance) ?? undefined,
  };
}

function parseLiveTrackingResponse(payload: unknown): LiveTrackingResponse {
  if (!isObject(payload)) {
    return { buses: [] };
  }

  const rootData = isObject(payload.data) ? payload.data : payload;

  const busesSource = Array.isArray(rootData.buses)
    ? rootData.buses
    : Array.isArray(rootData.items)
      ? rootData.items
      : Array.isArray(payload)
        ? payload
        : [];

  const pollingIntervalSeconds = toNumber(
    rootData.pollingIntervalSeconds ?? payload.pollingIntervalSeconds,
  );

  return {
    buses: busesSource
      .map((bus, index) => normalizeBus(bus, index))
      .filter((bus): bus is Bus => bus !== null),
    pollingIntervalSeconds: pollingIntervalSeconds ?? undefined,
  };
}

function getRouteNameFromStorage() {
  if (typeof window === "undefined") {
    return "all";
  }

  try {
    return window.localStorage.getItem("currentRouteName") ?? "all";
  } catch {
    return "all";
  }
}

function getStatusLabel(status?: string) {
  if (!status) {
    return "active";
  }

  return status.toLowerCase();
}

function getStatusClasses(status?: string) {
  const normalized = getStatusLabel(status);

  if (normalized === "inactive") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized === "stale") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function LiveTrackingPage() {
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [pollingIntervalSeconds, setPollingIntervalSeconds] = useState(DEFAULT_POLLING_INTERVAL_SECONDS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const coordsRef = useRef<LocationPoint | null>(null);
  const pollingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const syncSelectedRoute = () => {
      setSelectedRoute(getRouteNameFromStorage());
    };

    const handleRouteSelectionChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setSelectedRoute(customEvent.detail || "all");
    };

    syncSelectedRoute();

    window.addEventListener("storage", syncSelectedRoute);
    window.addEventListener("focus", syncSelectedRoute);
    window.addEventListener("route-selection-change", handleRouteSelectionChange as EventListener);

    return () => {
      window.removeEventListener("storage", syncSelectedRoute);
      window.removeEventListener("focus", syncSelectedRoute);
      window.removeEventListener("route-selection-change", handleRouteSelectionChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("token");

    if (!token) {
      setErrorMessage("Please log in to view live buses.");
      setIsLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("This browser does not support geolocation.");
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        coordsRef.current = nextLocation;
        setCurrentLocation(nextLocation);
        setLocationAllowed(true);
        setLocationError(null);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationAllowed(false);
          setLocationError("Enable location to see live buses near you.");
          setIsLoading(false);
          return;
        }

        setLocationError(error.message || "Unable to read device location.");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("token");

    if (!token || !coordsRef.current || !locationAllowed) {
      return;
    }

    let cancelled = false;

    const syncLiveBuses = async () => {
      try {
        setIsRefreshing(true);
        setErrorMessage(null);

        const { latitude, longitude } = coordsRef.current as { latitude: number; longitude: number };
        const routeName = selectedRoute === "all" ? null : selectedRoute;

        const endpoint = routeName
          ? `/buses/live/route?routeName=${encodeURIComponent(routeName)}&latitude=${latitude}&longitude=${longitude}`
          : `/buses/live/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=5&limit=25`;

        const response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) {
          return;
        }

        const parsed = parseLiveTrackingResponse(response.data);

        setBuses(parsed.buses);
        setPollingIntervalSeconds(parsed.pollingIntervalSeconds ?? DEFAULT_POLLING_INTERVAL_SECONDS);
        setLastSyncAt(new Date().toLocaleTimeString());
        setIsLoading(false);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage("Unable to refresh live buses right now.");
        setIsLoading(false);
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    void syncLiveBuses();

    if (pollingTimeoutRef.current) {
      window.clearInterval(pollingTimeoutRef.current);
    }

    pollingTimeoutRef.current = window.setInterval(syncLiveBuses, pollingIntervalSeconds * 1000);

    return () => {
      cancelled = true;

      if (pollingTimeoutRef.current) {
        window.clearInterval(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [locationAllowed, pollingIntervalSeconds, selectedRoute]);

  const visibleBuses = buses;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Live Tracking</h1>
            <p className="mt-1 text-sm text-slate-600">
              {selectedRoute === "all"
                ? "Showing nearby buses from the backend"
                : `Showing live buses for route ${selectedRoute}`}
            </p>
          </div>

          <div className="text-sm text-slate-600">
            <p>
              Polling every <span className="font-semibold text-slate-900">{pollingIntervalSeconds}s</span>
            </p>
            <p>
              Last sync: <span className="font-semibold text-slate-900">{lastSyncAt ?? "waiting for location"}</span>
            </p>
          </div>
        </div>

        {(locationError || errorMessage) && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Location access needed</p>
            <p className="mt-1">{locationError ?? errorMessage}</p>
          </div>
        )}

        {locationAllowed && (
          <div className="mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Live location connected to backend
          </div>
        )}
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="relative min-w-0 w-full max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow lg:col-span-3">
          {isLoading && buses.length === 0 ? (
            <div className="flex h-125 items-center justify-center text-sm text-slate-500">
              Loading live buses from the backend...
            </div>
          ) : (
            <LiveTrackingMap buses={visibleBuses} currentLocation={currentLocation} />
          )}
        </div>

        <div className="relative min-w-0 w-full max-w-full rounded-2xl bg-white p-4 shadow">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Buses Near You</h2>
            {isRefreshing && <span className="text-xs font-medium text-slate-500">Refreshing…</span>}
          </div>

          <p className="mb-4 text-sm text-gray-500">
            {selectedRoute === "all" ? "Showing buses returned by /nearby" : `Showing route ${selectedRoute}`}
          </p>

          <div className="max-h-125 space-y-3 overflow-y-auto">
            {visibleBuses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                {locationAllowed ? "No live buses found for the selected route." : "Allow location to load nearby buses."}
              </div>
            ) : visibleBuses.map((bus) => (
              <div
                key={bus.id}
                className="min-w-0 w-full rounded-lg border border-slate-200 p-3 transition hover:shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="wrap-break-word text-sm font-semibold text-slate-900">{bus.id}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getStatusClasses(bus.status)}`}>
                    {getStatusLabel(bus.status)}
                  </span>
                </div>

                <p className="wrap-break-word text-sm text-slate-600">
                  {bus.routeName}
                  {bus.from && bus.to ? ` · ${bus.from} → ${bus.to}` : ""}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>Lat {bus.latitude.toFixed(5)}</span>
                  <span>Lng {bus.longitude.toFixed(5)}</span>
                  {typeof bus.distanceKm === "number" && <span>{bus.distanceKm.toFixed(2)} km away</span>}
                </div>

                {bus.heading && <p className="mt-1 wrap-break-word text-xs text-slate-500">Heading: {bus.heading}</p>}

                {bus.type && <p className="mt-1 text-xs font-medium text-emerald-700">{bus.type}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}