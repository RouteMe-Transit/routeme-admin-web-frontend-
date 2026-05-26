"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

type Bus = {
  id: string;
  route: string;
  from: string;
  to: string;
  heading: string;
  type: string;
  latitude: number;
  longitude: number;
};

const LiveTrackingMap = dynamic(() => import("@/app/passenger/liveTracking/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-125 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

const buses: Bus[] = [
  {
    id: "NA-1876",
    route: "115",
    from: "Udahamulla",
    to: "Pettah",
    heading: "Pettah",
    type: "Standard",
    latitude: 6.8781,
    longitude: 79.8829,
  },
  {
    id: "NA-4421",
    route: "120",
    from: "Horana",
    to: "Pettah",
    heading: "Horana",
    type: "Standard",
    latitude: 6.9185,
    longitude: 79.8659,
  },
  {
    id: "NA-2203",
    route: "122",
    from: "Avissawella",
    to: "Pettah",
    heading: "Pettah",
    type: "Semi-Luxury",
    latitude: 6.9423,
    longitude: 79.8585,
  },
  {
    id: "NA-3158",
    route: "125",
    from: "Padukka",
    to: "Pettah",
    heading: "Pettah",
    type: "Standard",
    latitude: 6.9001,
    longitude: 79.9327,
  },
  {
    id: "NA-5067",
    route: "140",
    from: "Wellampitiya",
    to: "Kollupitiya",
    heading: "Kollupitiya",
    type: "Standard",
    latitude: 6.9413,
    longitude: 79.8809,
  },
  {
    id: "NA-6634",
    route: "150",
    from: "Maharagama",
    to: "Pettah",
    heading: "Maharagama",
    type: "Standard",
    latitude: 6.8649,
    longitude: 79.8997,
  },
];

export default function LiveTrackingPage() {
  const [selectedRoute, setSelectedRoute] = useState("all");

  useEffect(() => {
    const syncSelectedRoute = () => {
      try {
        setSelectedRoute(localStorage.getItem("currentRouteName") ?? "all");
      } catch {
        setSelectedRoute("all");
      }
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

  const visibleBuses = selectedRoute === "all"
    ? buses
    : buses.filter((bus) => bus.route === selectedRoute);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gray-100 p-4 sm:p-6">
      {/* Main Layout */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Map Section */}
        <div className="relative min-w-0 w-full max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow lg:col-span-3">
          <LiveTrackingMap buses={visibleBuses} />
        </div>

        {/* Sidebar Bus List */}
        <div className="relative min-w-0 w-full max-w-full rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-2 text-lg font-semibold">Buses Near You</h2>
          <p className="mb-4 text-sm text-gray-500">
            {selectedRoute === "all" ? "Showing all routes" : `Showing route ${selectedRoute}`}
          </p>

          <div className="space-y-3 max-h-125 overflow-y-auto">
            {visibleBuses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                No buses found for the selected route.
              </div>
            ) : visibleBuses.map((bus) => (
              <div
                key={bus.id}
                className="min-w-0 w-full rounded-lg border p-3 transition hover:shadow-sm"
              >
                <h3 className="wrap-break-word text-sm font-semibold">{bus.id}</h3>

                <p className="wrap-break-word text-sm text-gray-600">
                  {bus.route} {bus.from} → {bus.to}
                </p>

                <p className="wrap-break-word text-xs text-gray-500">
                  Heading: {bus.heading}
                </p>

                <span className="text-xs text-green-600 font-medium">
                  {bus.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}