"use client";

import type { FC } from "react";
import { useState } from "react";

type Route = {
  id: number;
  title: string;
  duration: string;
  stops: string;
  extraInfo: string;
  color: string;
};

const routesData: Route[] = [
  {
    id: 1,
    title: "Kurunegala - Avissawella - Pambahinna",
    duration: "32 Mins",
    stops: "Direct, 4 Stops",
    extraInfo: "Fastest, 3 min wait",
    color: "bg-green-200",
  },
  {
    id: 2,
    title: "Kurunegala - Colombo - Badulla",
    duration: "41 Mins",
    stops: "1 Change, 6 Stops",
    extraInfo: "Fewer Changes, 9 min wait",
    color: "bg-gray-200",
  },
  {
    id: 3,
    title: "Kurunegala - Rathnapura - Palmadulla",
    duration: "55 Mins",
    stops: "2 Changes, 8 Stops",
    extraInfo: "15 min wait",
    color: "bg-gray-200",
  },
];

const PassengerRouteFinder: FC = () => {
  const [startLocation, setStartLocation] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-semibold mb-6">Route Finder</h1>

      {/* Start Location */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Starting Location"
          className="flex-1 p-2 border rounded"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
        />
        <button className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Find Routes
        </button>
        <button className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500">
          Now
        </button>
      </div>

      {/* Suggested Routes */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Suggested Routes</h2>
        <div className="flex flex-col gap-3">
          {routesData.map((route) => (
            <div
              key={route.id}
              className={`flex justify-between items-center p-4 rounded cursor-pointer hover:shadow ${route.color}`}
              onClick={() => setSelectedRoute(route)}
            >
              <div>
                <div className="font-semibold">{route.title}</div>
                <div className="text-sm text-gray-600">
                  {route.duration} • {route.stops}
                </div>
              </div>
              <div className="text-sm text-gray-700">{route.extraInfo}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Details */}
      {selectedRoute && (
        <div className="p-4 bg-white rounded shadow mb-6">
          <h3 className="font-semibold mb-2">Route Details:</h3>
          <div className="flex flex-col gap-2">
            <span className="text-gray-700">Route: {selectedRoute.title}</span>
            <span className="text-gray-700">Duration: {selectedRoute.duration}</span>
            <span className="text-gray-700">Stops: {selectedRoute.stops}</span>
            <span className="text-gray-700">Extra Info: {selectedRoute.extraInfo}</span>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Select Date</h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default PassengerRouteFinder;
