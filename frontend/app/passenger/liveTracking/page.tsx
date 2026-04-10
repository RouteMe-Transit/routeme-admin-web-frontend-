"use client";

import React from "react";

type Bus = {
  id: string;
  route: string;
  from: string;
  to: string;
  heading: string;
  type: string;
};

const buses: Bus[] = [
  {
    id: "NA-1876",
    route: "115",
    from: "Udahamulla",
    to: "Pettah",
    heading: "Pettah",
    type: "Standard",
  },
  {
    id: "NA-4421",
    route: "120",
    from: "Horana",
    to: "Pettah",
    heading: "Horana",
    type: "Standard",
  },
  {
    id: "NA-2203",
    route: "122",
    from: "Avissawella",
    to: "Pettah",
    heading: "Pettah",
    type: "Semi-Luxury",
  },
  {
    id: "NA-3158",
    route: "125",
    from: "Padukka",
    to: "Pettah",
    heading: "Pettah",
    type: "Standard",
  },
  {
    id: "NA-5067",
    route: "140",
    from: "Wellampitiya",
    to: "Kollupitiya",
    heading: "Kollupitiya",
    type: "Standard",
  },
  {
    id: "NA-6634",
    route: "150",
    from: "Maharagama",
    to: "Pettah",
    heading: "Maharagama",
    type: "Standard",
  },
];

export default function LiveTrackingPage() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl text-green-600">● Live</h1>
        </div>

        <div className="flex gap-3">
          <select className="border rounded-lg px-4 py-2">
            <option>All Routes</option>
            <option>115</option>
            <option>120</option>
            <option>122</option>
          </select>

          <button className="bg-[#4caf8a] text-white px-4 py-2 rounded-lg hover:bg-[#3f9c79]">
            Refresh
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow p-4">
          <div className="w-full h-[500px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
            Map Placeholder
          </div>
        </div>

        {/* Sidebar Bus List */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Buses Near You</h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
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