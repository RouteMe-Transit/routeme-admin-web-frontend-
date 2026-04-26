"use client";
import { useState } from "react";

type Trip = {
  id: number;
  direction: string;
  departure: string;
  arrival: string;
  days: string;
  status: "start" | "ongoing" | "finished";
};

type Stop = {
  id: number;
  name: string;
  status: "departed" | "current" | "upcoming";
  time?: string;
};

export default function DriverSchedulePage() {
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: 1,
      direction: "Fort → Mount Lavinia",
      departure: "06:00 AM",
      arrival: "06:50 AM",
      days: "Mon–Sat",
      status: "finished",
    },
    {
      id: 2,
      direction: "Mount Lavinia → Fort",
      departure: "07:15 AM",
      arrival: "08:05 AM",
      days: "Mon–Sat",
      status: "finished",
    },
    {
      id: 3,
      direction: "Fort → Mount Lavinia",
      departure: "09:30 AM",
      arrival: "10:20 AM",
      days: "Mon–Sat",
      status: "ongoing",
    },
    {
      id: 4,
      direction: "Mount Lavinia → Fort",
      departure: "10:45 AM",
      arrival: "11:35 AM",
      days: "Mon–Sat",
      status: "start",
    },
    {
      id: 5,
      direction: "Fort → Moratuwa",
      departure: "12:10 PM",
      arrival: "01:05 PM",
      days: "Mon–Fri",
      status: "start",
    },
    {
      id: 6,
      direction: "Moratuwa → Fort",
      departure: "01:30 PM",
      arrival: "02:25 PM",
      days: "Mon–Fri",
      status: "ongoing",
    },
    {
      id: 7,
      direction: "Fort → Panadura",
      departure: "03:00 PM",
      arrival: "04:10 PM",
      days: "Daily",
      status: "start",
    },
    {
      id: 8,
      direction: "Panadura → Fort",
      departure: "04:35 PM",
      arrival: "05:45 PM",
      days: "Daily",
      status: "finished",
    },
    {
      id: 9,
      direction: "Fort → Galle",
      departure: "06:00 PM",
      arrival: "08:30 PM",
      days: "Mon–Sat",
      status: "start",
    },
    {
      id: 10,
      direction: "Galle → Fort",
      departure: "09:00 PM",
      arrival: "11:20 PM",
      days: "Mon–Sat",
      status: "ongoing",
    },
  ]);

  const [stops] = useState<Stop[]>([
    { id: 1, name: "Colombo Fort", status: "departed" },
    { id: 2, name: "Pettah", status: "departed" },
    { id: 3, name: "Maradana", status: "departed" },
    { id: 4, name: "Borella", status: "current" },
    { id: 5, name: "Narahenpita", status: "upcoming", time: "4 min" },
    { id: 6, name: "Bambalapitiya", status: "upcoming", time: "11 min" },
    { id: 7, name: "Wellawatte", status: "upcoming", time: "18 min" },
    { id: 8, name: "Dehiwala", status: "upcoming", time: "26 min" },
    { id: 9, name: "Mount Lavinia", status: "upcoming", time: "34 min" },
  ]);

  // ✅ Handle status change
  const handleStatusChange = (id: number) => {
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id === id) {
          if (trip.status === "start") return { ...trip, status: "ongoing" };
          if (trip.status === "ongoing") return { ...trip, status: "finished" };
        }
        return trip;
      })
    );
  };


    return (
    <section className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT SIDE - TABLE */}
      <div className="bus-trip-table-wrap lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        
        <div className="bus-trip-header border-b border-slate-200 bg-linear-to-r from-slate-50 to-white px-4 py-3.5">
          <h2 className="text-base font-semibold text-slate-800">
            Bus NA-1876 — Active Schedule
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage trip timing, direction, and live progress from one place.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-175 border-collapse text-[13px]">
            <thead className="bg-slate-900 text-slate-100">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">
                  Trip
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">
                  Direction
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">
                  Departure
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">
                  Arrival
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">
                  Days
                </th>
                <th className="px-4 py-3 font-medium uppercase tracking-[0.08em] text-[10px]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {trips.map((trip, index) => (
                <tr
                  key={trip.id}
                  className={`bus-trip-row border-b border-slate-100 transition-colors hover:bg-sky-50/70 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-[11px] font-semibold text-white shadow-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="bus-trip-direction px-4 py-3 font-medium text-slate-800">
                    {trip.direction}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{trip.departure}</td>
                  <td className="px-4 py-3 text-slate-600">{trip.arrival}</td>
                  <td className="px-4 py-3 text-slate-600">{trip.days}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusChange(trip.id)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 ${
                        trip.status === "finished"
                          ? "bg-blue-700 hover:bg-blue-800"
                          : trip.status === "ongoing"
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {trip.status === "start"
                        ? "Start"
                        : trip.status === "ongoing"
                        ? "Ongoing"
                        : "Finished"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDE - STOP TIMELINE */}
      <div className="bus-trip-timeline rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm lg:justify-self-end lg:w-full lg:max-w-100.5">
        
        <h3 className="mb-2 text-xs font-semibold text-slate-800">
          Stop Sequence
        </h3>

        <div className="space-y-2.5">
          {stops.map((stop) => (
            <div key={stop.id} className="flex items-start gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-slate-50">
              
              {/* DOT */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    stop.status === "current"
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                />
                <div className="h-5 w-px bg-gray-300"></div>
              </div>

              {/* TEXT */}
              <div>
                <p
                  className={`text-[13px] font-medium ${
                    stop.status === "current"
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {stop.name}
                </p>

                <p className="text-[10px] text-gray-400">
                  {stop.status === "departed"
                    ? "Departed"
                    : stop.status === "current"
                    ? "Now"
                    : stop.time}
                </p>
              </div>

              <div className="ml-auto pt-0.5 text-right text-[8px] font-semibold uppercase tracking-wide text-gray-400">
                {String(stop.id).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
