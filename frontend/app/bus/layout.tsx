"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/app/components/topBar/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";
import { usePathname } from "next/navigation";
import { BusThemeProvider, useBusTheme } from "./BusThemeContext";
import AuthGuard from "./AuthGuard";

type BusLayoutProps = {
    children: ReactNode;
};

type TopbarItem = {
    title: string;
    icon: ReactNode | null;
};

type BusInfo = {
    busId?: string;
    routeNumber?: string;
    routeName?: string;
    drivers?: AssignedDriver[];
    defaultDriver?: string;
};

type AssignedDriver = {
    id?: string | number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    status?: string;
};

const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
};

type LocationPoint = {
    latitude: number;
    longitude: number;
};

const getApiBaseUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
    return apiUrl.replace(/\/+$/, "");
};

async function postBusLiveLocation(payload: {
    gpsOn: boolean;
    latitude?: number;
    longitude?: number;
    timestamp?: string;
}) {
    const response = await fetch(`${getApiBaseUrl()}/buses/live/location`, {
        method: "POST",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update live location (${response.status})`);
    }
}

async function fetchAssignedDrivers(): Promise<AssignedDriver[]> {
    const response = await fetch(`${getApiBaseUrl()}/buses/me/assigned-drivers`, {
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        return [];
    }

    const data = (await response.json()) as {
        data?: {
            drivers?: AssignedDriver[];
        };
    };

    return Array.isArray(data?.data?.drivers) ? data.data.drivers : [];
}

export default function BusLayout({ children }: BusLayoutProps) {
    return (
        <AuthGuard>
            <BusThemeProvider>
                <BusLayoutContent>{children}</BusLayoutContent>
            </BusThemeProvider>
        </AuthGuard>
    );
}

function BusLayoutContent({ children }: BusLayoutProps) {
    const pathname = usePathname();
    const { theme } = useBusTheme();
    const showTopBar = pathname !== "/bus/profile";
    const [gpsEnabled, setGpsEnabled] = useState(false);
    const configMap = topbarConfig as Record<string, TopbarItem>;
    const config = configMap[pathname] ?? { title: "Bus", icon: null };
    const [busInfo, setBusInfo] = useState<BusInfo | undefined>(undefined);
    const latestLocationRef = useRef<LocationPoint | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const uploadIntervalRef = useRef<number | null>(null);
    const gpsWasEverEnabledRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        let cancelled = false;

        const clearGpsTracking = async (shouldMarkInactive: boolean) => {
            if (watchIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }

            if (uploadIntervalRef.current !== null) {
                window.clearInterval(uploadIntervalRef.current);
                uploadIntervalRef.current = null;
            }

            if (shouldMarkInactive) {
                try {
                    await postBusLiveLocation({ gpsOn: false });
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("[busLayout] Failed to mark GPS inactive", error);
                }
            }
        };

        const startGpsTracking = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setGpsEnabled(false);
                return;
            }

            if (!navigator.geolocation) {
                setGpsEnabled(false);
                return;
            }

            const uploadCurrentLocation = async (point: LocationPoint) => {
                await postBusLiveLocation({
                    gpsOn: true,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    timestamp: new Date().toISOString(),
                });
            };

            const sendLatestLocation = async () => {
                const point = latestLocationRef.current;

                if (!point) {
                    return;
                }

                try {
                    await uploadCurrentLocation(point);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("[busLayout] Failed to upload GPS location", error);
                }
            };

            try {
                await new Promise<void>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const point = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            };

                            latestLocationRef.current = point;

                            try {
                                await uploadCurrentLocation(point);
                            } catch (error) {
                                reject(error);
                                return;
                            }

                            resolve();
                        },
                        (error) => {
                            reject(error);
                        },
                        {
                            enableHighAccuracy: true,
                            maximumAge: 5000,
                            timeout: 10000,
                        },
                    );
                });

                if (cancelled) {
                    return;
                }

                watchIdRef.current = navigator.geolocation.watchPosition(
                    (position) => {
                        latestLocationRef.current = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        };
                        void sendLatestLocation();
                    },
                    async (error) => {
                        // eslint-disable-next-line no-console
                        console.error("[busLayout] GPS watch failed", error);
                        await clearGpsTracking(true);
                        if (!cancelled) {
                            setGpsEnabled(false);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 5000,
                        timeout: 10000,
                    },
                );

                uploadIntervalRef.current = window.setInterval(() => {
                    void sendLatestLocation();
                }, 10000);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error("[busLayout] Failed to start GPS tracking", error);
                await clearGpsTracking(true);
                if (!cancelled) {
                    setGpsEnabled(false);
                }
            }
        };

        if (!gpsEnabled) {
            void clearGpsTracking(false);
            return () => {
                cancelled = true;
            };
        }

        gpsWasEverEnabledRef.current = true;
        void startGpsTracking();

        return () => {
            cancelled = true;

            if (gpsWasEverEnabledRef.current) {
                void clearGpsTracking(true);
            }
        };
    }, [gpsEnabled]);

    useEffect(() => {
        let isMounted = true;
        // eslint-disable-next-line no-console
        console.log("[busLayout] useEffect running");

        const loadBusInfo = async () => {
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
                const headers = getAuthHeaders();
                
                // eslint-disable-next-line no-console
                console.log("[busLayout] Starting loadBusInfo, apiBaseUrl:", apiBaseUrl);
                
                // Try /bus-trips/today to extract bus and route info
                const response = await fetch(`${apiBaseUrl.replace(/\/+$/, "")}/bus-trips/today`, {
                    cache: "no-store",
                    headers,
                });

                // eslint-disable-next-line no-console
                console.log("[busLayout] /bus-trips/today response status:", response.status);

                if (!response.ok) {
                    // eslint-disable-next-line no-console
                    console.log("[busLayout] /bus-trips/today failed");
                    return;
                }

                const data = (await response.json()) as any;

                // eslint-disable-next-line no-console
                console.log("[busLayout] /bus-trips/today raw data:", JSON.stringify(data).substring(0, 500));

                if (!isMounted) return;

                // Extract bus info and trips from response
                const busData = data?.data ?? data;
                const firstTrip = Array.isArray(busData?.trips) ? busData.trips[0] : undefined;

                // eslint-disable-next-line no-console
                console.log("[busLayout] busData:", busData);
                // eslint-disable-next-line no-console
                console.log("[busLayout] firstTrip:", firstTrip);

                const busId = busData?.registrationNumber ?? busData?.busId ?? undefined;
                const routeName = firstTrip?.routeName ?? undefined;

                // eslint-disable-next-line no-console
                console.log("[busLayout] Extracted busId:", busId, "routeName:", routeName);

                setBusInfo({
                    busId,
                    routeNumber: firstTrip?.routeNumber ?? undefined,
                    routeName,
                    drivers: await fetchAssignedDrivers(),
                    defaultDriver: firstTrip?.defaultDriver ?? undefined,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log("[busLayout] Error loading bus info:", error);
            }
        };

        loadBusInfo();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div data-theme={theme} className="bus-theme h-dvh w-full overflow-hidden bg-primary text-accent flex">
            <Sidebar role="bus" gpsEnabled={gpsEnabled} onGpsToggle={setGpsEnabled} />
            <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
                {showTopBar && <TopBar title={config.title} icon={config.icon} busInfo={busInfo} gpsEnabled={gpsEnabled} />}
                <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">{children}</main>
            </div>
        </div>
    );
}
