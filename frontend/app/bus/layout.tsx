"use client";

import { useEffect, useState, type ReactNode } from "react";
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
    drivers?: string[];
    defaultDriver?: string;
};

const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
};

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
                    drivers: firstTrip?.drivers ?? undefined,
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
