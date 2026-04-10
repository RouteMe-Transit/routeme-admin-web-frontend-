"use client";

import React from "react";
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
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow p-4">
          <LiveTrackingMap buses={buses} />
        </div>

        {/* Sidebar Bus List */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Buses Near You</h2>

          <div className="space-y-3 max-h-125 overflow-y-auto">
            {buses.map((bus) => (
              <div
                key={bus.id}
                className="border rounded-lg p-3 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-sm">{bus.id}</h3>

                <p className="text-sm text-gray-600">
                  {bus.route} {bus.from} → {bus.to}
                </p>

                <p className="text-xs text-gray-500">
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