"use client";

import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/config/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";
import { usePathname } from "next/navigation";

type BusLayoutProps = {
	children: ReactNode;
};

type TopbarItem = {
	title: string;
	icon: ReactNode | null;
};

type BusInfo = {
	busId: string;
	routeNumber: string;
	drivers: string[];
	defaultDriver?: string;
};

const defaultBusInfo: BusInfo = {
	busId: "NB-4587",
	routeNumber: "138",
	drivers: ["Amila Perera", "Kasun Silva", "Nimal Fernando"],
	defaultDriver: "Amila Perera",
};

export default function BusLayout({ children }: BusLayoutProps) {
	const pathname = usePathname();
	const [gpsEnabled, setGpsEnabled] = useState(false);
	const configMap = topbarConfig as Record<string, TopbarItem>;
	const config = configMap[pathname] ?? { title: "Bus", icon: null };
	const [busInfo, setBusInfo] = useState<BusInfo>(defaultBusInfo);

	useEffect(() => {
		let isMounted = true;

		const loadBusInfo = async () => {
			try {
				const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
				const response = await fetch(
					`${apiBaseUrl ?? ""}/api/bus/topbar-info`,
					{ cache: "no-store" } //always get fresh data for topbar, no caching
				);

				if (!response.ok) return;

				const data = (await response.json()) as Partial<BusInfo>;

				if (!isMounted) return;

				setBusInfo({
					busId: data.busId ?? defaultBusInfo.busId,
					routeNumber: data.routeNumber ?? defaultBusInfo.routeNumber,
					drivers:
						data.drivers && data.drivers.length > 0
							? data.drivers
							: defaultBusInfo.drivers,
					defaultDriver: data.defaultDriver ?? defaultBusInfo.defaultDriver,
				});
			} catch {
				// Keep default values when API is unavailable.
			}
		};

		loadBusInfo();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<div className="min-h-screen w-full bg-primary text-accent flex">
			<Sidebar role="bus" gpsEnabled={gpsEnabled} onGpsToggle={setGpsEnabled} />
			<div className="flex-1 flex flex-col">
				<TopBar title={config.title} icon={config.icon} busInfo={busInfo} gpsEnabled={gpsEnabled} />
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
