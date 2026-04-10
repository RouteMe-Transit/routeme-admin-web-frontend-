"use client";

import { type ReactNode } from "react";
import { FaCircle } from "react-icons/fa";

type BusInfo = {
  busId: string;
  routeNumber: string;
  drivers: string[];
  defaultDriver?: string;
};

type TopBarProps = {
  title: string;
  icon: ReactNode | null;
  busInfo?: BusInfo;
  gpsEnabled?: boolean;
};

const TopBar = ({ title, icon, busInfo, gpsEnabled = false }: TopBarProps) => {
  const defaultDriver = busInfo?.defaultDriver ?? busInfo?.drivers[0] ?? "";
  const driverSelectKey = `${busInfo?.busId ?? "no-bus"}-${defaultDriver}`;

  return (
    <div className="w-full h-16 bg-white shadow flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {icon}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {busInfo && (
        <div className="flex items-center gap-4">
            
          <div className="flex items-center gap-2">
            <FaCircle
              className={`${gpsEnabled ? "text-green-500" : "text-red-500"} mr-2 ${gpsEnabled ? "animate-pulse" : ""}`}
            />
            <div
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                gpsEnabled
                  ? "border-green-500 text-green-600 bg-green-50"
                  : "border-red-500 text-red-600 bg-red-50"
              }`}
            >
              Tracking Live
            </div>
          </div>
          <div className="rounded-md border border-[#94A0AE] bg-slate-50 px-3 py-2">
            <label className="text-xs font-semibold text-slate-500">Driver</label>
            <select
              key={driverSelectKey}
              className="ml-2 rounded bg-white px-2 py-1 text-sm text-slate-700 outline-none"
              defaultValue={defaultDriver}
            >
              {busInfo.drivers.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-full border border-[#94A0AE] bg-[#EEEEEE] px-3 py-2 text-sm text-slate-700 flex items-center gap-1">
            <img src="/icons/bus.png" alt="bus" className=" w-5 h-5 mr-1" />
            <div>
                <p className="font-bold">Bus ID: {busInfo.busId}</p>
                <p>Route: {busInfo.routeNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
