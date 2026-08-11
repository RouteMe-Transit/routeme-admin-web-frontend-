"use client";

import { type ReactNode, useEffect, useState } from "react";
import { FaCircle } from "react-icons/fa";
import { usePathname } from "next/navigation";
import api from "@/app/services/api";

type BusInfo = {
  busId?: string;
  routeNumber?: string;
  routeName?: string;
  drivers?: {
    id?: string | number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    status?: string;
  }[];
  defaultDriver?: string;
};

type RouteOption = {
  id: string;
  value: string;
  label: string;
};

type BackendRoute = {
  id?: string | number;
  routeName?: string;
  routeNumber?: string;
  from?: string;
  to?: string;
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
  const defaultDriver = busInfo?.defaultDriver ?? String(busInfo?.drivers?.[0]?.id ?? "");
  const driverSelectKey = `${busInfo?.busId ?? "no-bus"}-${defaultDriver}`;
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("all");

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
      }
    } catch (e) {
      // ignore
    }
  }, [busInfo]);

  useEffect(() => {
    if (!isPassengerLiveTracking || busInfo) {
      return;
    }

    const loadRoutes = async () => {
      setRoutesLoading(true);

      try {
        const response = await api.get("/routes", {
          params: { limit: 200 },
        });

        const payload = response.data?.data?.routes ?? response.data?.routes ?? response.data?.data ?? [];
        const normalizedRoutes = Array.isArray(payload)
          ? payload
              .map((route: BackendRoute) => {
                const routeNumber = route.routeNumber?.trim() ?? "";
                const routeName = route.routeName?.trim() ?? "";
                const fromTo = [route.from?.trim(), route.to?.trim()].filter(Boolean).join(" - ");
                const routeLabel = routeNumber || routeName || `Route ${route.id ?? ""}`;
                const label = fromTo ? `${routeLabel} (${fromTo})` : routeLabel;

                return {
                  id: String(route.id ?? label),
                  value: routeNumber || routeName || String(route.id ?? label),
                  label,
                };
              })
              .filter((route) => route.value.trim().length > 0)
          : [];

        setRoutes(normalizedRoutes);

        try {
          const savedRoute = localStorage.getItem("currentRouteName");
          if (savedRoute) {
            setSelectedRoute(savedRoute);
          }
        } catch {
          // ignore localStorage issues
        }
      } catch {
        setRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    };

    loadRoutes();
  }, [busInfo, isPassengerLiveTracking]);

  const handleRouteChange = (value: string) => {
    setSelectedRoute(value);

    try {
      if (value === "all") {
        localStorage.removeItem("currentRouteName");
      } else {
        localStorage.setItem("currentRouteName", value);
      }

      window.dispatchEvent(new CustomEvent("route-selection-change", { detail: value }));
    } catch {
      // ignore localStorage issues
    }
  };

  return (
    <div className={`${topbarThemeClass} sticky top-0 z-10 flex h-auto min-h-16 w-full shrink-0 ${isBusRoute ? "flex-col gap-3" : "flex-col sm:flex-row sm:items-center"} justify-between overflow-x-hidden bg-white px-4 py-3 shadow sm:px-6 ${isBusRoute ? "" : "sm:h-16"}`}>
      {isBusRoute ? (
        /* Responsive grid:
           - mobile: 2 columns -> row1: title + tracking, row2: driver + bus info
           - sm+: 4 columns -> single row: title | tracking | driver | bus info
        */
        <div className="w-full grid grid-cols-2 items-center gap-3 sm:gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          {/* Title */}
          <div className="col-span-1 flex min-w-0 items-center gap-3 pl-12 sm:pl-0">
            <span className="hidden sm:inline">{icon}</span>
            <h1 className="min-w-0 wrap-break-word text-xl font-bold sm:text-2xl">{title}</h1>
          </div>

          {/* Tracking (places to right of title on mobile, second column) */}
          <div className="col-span-1 flex justify-end items-center gap-2 whitespace-nowrap">
            <FaCircle className={`${gpsEnabled ? "text-green-500" : "text-red-500"} mr-2 ${gpsEnabled ? "animate-pulse" : ""}`} />
            <div className={`rounded-md border px-2 py-1 text-xs font-semibold ${gpsEnabled ? "border-green-500 text-green-600 bg-green-50" : "border-red-500 text-red-600 bg-red-50"}`}>
              Tracking Live
            </div>
          </div>

          {/* Driver (mobile: left of second row; sm+: third column) */}
          {busInfo ? (
            <div className="col-span-1 mt-2 sm:mt-0 flex justify-start sm:justify-end items-center">
              <div className="rounded-md border border-[#94A0AE] bg-slate-50 px-3 py-2">
                <label className="text-xs font-semibold text-slate-500">Driver</label>
                <select
                  key={driverSelectKey}
                  className="ml-2 w-40 rounded bg-white px-2 py-1 text-sm text-slate-700 outline-none"
                  defaultValue={defaultDriver || "none"}
                >
                  {(busInfo.drivers ?? []).length === 0 ? (
                    <option value="none" disabled>
                      No drivers assigned
                    </option>
                  ) : (
                    <>
                      <option value="none" disabled>
                        Select driver
                      </option>
                      {(busInfo.drivers ?? []).map((driver) => {
                        const label = driver.fullName?.trim() || `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.trim() || `Driver ${driver.id ?? ""}`;

                        return (
                          <option key={String(driver.id ?? label)} value={String(driver.id ?? label)}>
                            {label}
                          </option>
                        );
                      })}
                    </>
                  )}
                </select>
              </div>
            </div>
          ) : (
            <div className="col-span-1" />
          )}

          {/* Bus info (mobile: right of second row; sm+: fourth column) */}
          {busInfo ? (
            <div className="col-span-1 mt-2 sm:mt-0 flex justify-end items-center">
              <div className="bus-topbar-meta flex h-14 w-42.5 items-center gap-1 rounded-full border border-[#94A0AE] bg-[#EEEEEE] px-3 py-2 text-sm text-slate-700">
                <img src="/icons/bus.png" alt="bus" className=" w-6 h-6 mr-2" />
                <div>
                  <p className="font-bold">{busInfo?.busId ?? ""}</p>
                  <p>{busInfo?.routeName ?? busInfo?.routeNumber ?? ""}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-1" />
          )}
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3 pl-12 sm:gap-4 sm:pl-0">
            {icon}
            <h1 className="min-w-0 wrap-break-word text-xl font-bold sm:text-2xl">{title}</h1>
          </div>

          {(!busInfo && isPassengerLiveTracking) && (
            <div className="ml-auto flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <FaCircle className="text-green-500 animate-pulse text-xs" />
                <span className="text-green-600 font-semibold">Live</span>
              </div>

              <select
                value={selectedRoute}
                onChange={(event) => handleRouteChange(event.target.value)}
                className="max-w-[calc(100vw-150px)] border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 whitespace-nowrap sm:max-w-none sm:px-4"
                aria-label="Select route"
              >
                <option value="all">All Routes</option>
                {routesLoading && <option value="loading" disabled>Loading routes…</option>}
                {!routesLoading && routes.length === 0 && <option value="none" disabled>No routes available</option>}
                {routes.map((route) => (
                  <option key={route.id} value={route.value}>
                    {route.label}
                  </option>
                ))}
              </select>

              <button type="button" onClick={() => window.location.reload()} className="hidden bg-[#4caf8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f9c79] sm:inline-flex rounded-lg">
                Refresh
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopBar;
