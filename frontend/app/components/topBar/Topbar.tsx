"use client";

import { type ReactNode, useEffect } from "react";
import { FaCircle } from "react-icons/fa";
import { usePathname } from "next/navigation";

type BusInfo = {
  busId?: string;
  routeNumber?: string;
  routeName?: string;
  drivers?: string[];
  defaultDriver?: string;
};

type TopBarProps = {
  title: string;
  icon: ReactNode | null;
  busInfo?: BusInfo;
  gpsEnabled?: boolean;
};

const TopBar = ({ title, icon, busInfo, gpsEnabled = false }: TopBarProps) => {
  const pathname = usePathname();
  const isPassengerLiveTracking = pathname === "/passenger/liveTracking";
  const isBusRoute = pathname.startsWith("/bus");
  const isAdminRoute = pathname.startsWith("/admin");
  const topbarThemeClass = isBusRoute
    ? "bus-topbar"
    : isAdminRoute
    ? "admin-topbar"
    : "passenger-topbar";
  const defaultDriver = busInfo?.defaultDriver ?? busInfo?.drivers?.[0] ?? "";
  const driverSelectKey = `${busInfo?.busId ?? "no-bus"}-${defaultDriver}`;

  useEffect(() => {
    try {
      if (busInfo?.busId) {
        localStorage.setItem("currentBusReg", busInfo.busId);
      } else {
        localStorage.removeItem("currentBusReg");
      }

      if (busInfo?.routeName) {
        localStorage.setItem("currentRouteName", busInfo.routeName);
      } else if (busInfo?.routeNumber) {
        localStorage.setItem("currentRouteName", String(busInfo.routeNumber));
      } else {
        localStorage.removeItem("currentRouteName");
      }
    } catch (e) {
      // ignore
    }
  }, [busInfo]);

  return (
    <div className={`${topbarThemeClass} sticky top-0 z-10 flex h-auto min-h-16 w-full shrink-0 flex-col justify-between gap-3 overflow-x-hidden bg-white px-4 py-3 shadow sm:h-16 sm:flex-row sm:items-center sm:px-6`}>
      <div className="flex min-w-0 items-center gap-3 pl-12 sm:gap-4 sm:pl-0">
        {icon}
        <h1 className="min-w-0 wrap-break-word text-xl font-bold sm:text-2xl">{title}</h1>
      </div>

      {isBusRoute ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 whitespace-nowrap">
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

          {busInfo && (
            <div className="rounded-md border border-[#94A0AE] bg-slate-50 px-3 py-2">
              <label className="text-xs font-semibold text-slate-500">Driver</label>
              <select
                key={driverSelectKey}
                className="ml-2 rounded bg-white px-2 py-1 text-sm text-slate-700 outline-none"
                defaultValue={defaultDriver}
              >
                {(busInfo.drivers ?? []).map((driver) => (
                  <option key={driver} value={driver}>
                    {driver}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bus-topbar-meta flex h-14 w-42.5 items-center gap-1 rounded-full border border-[#94A0AE] bg-[#EEEEEE] px-3 py-2 text-sm text-slate-700">
            <img src="/icons/bus.png" alt="bus" className=" w-6 h-6 mr-2" />
            <div>
                <p className="font-bold">{busInfo?.busId ?? ""}</p>
                <p>{busInfo?.routeName ?? busInfo?.routeNumber ?? ""}</p>
            </div>
          </div>
        </div>
      ) : (
        !busInfo && isPassengerLiveTracking ? (
          <div className="ml-auto flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <FaCircle className="text-green-500 animate-pulse text-xs" />
              <span className="text-green-600 font-semibold">Live</span>
            </div>

            <select className="max-w-[calc(100vw-150px)] border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 whitespace-nowrap sm:max-w-none sm:px-4">
              <option>All Routes</option>
              <option>115</option>
              <option>120</option>
              <option>122</option>
            </select>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="hidden bg-[#4caf8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f9c79] sm:inline-flex rounded-lg"
            >
              Refresh
            </button>
          </div>
        ) : null
      )}
    </div>
  );
};

export default TopBar;
