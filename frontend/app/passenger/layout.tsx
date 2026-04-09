"use client";
import type { ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/config/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";
import { usePathname } from "next/navigation";

type PassengerLayoutProps = {
	children: ReactNode;
};

type TopbarItem = {
	title: string;
	icon: ReactNode | null;
};

export default function PassengerLayout({ children }: PassengerLayoutProps) {
	const pathname = usePathname();
	const showTopBar = pathname !== "/passenger/profile";
	const configMap = topbarConfig as Record<string, TopbarItem>;
	const config = configMap[pathname] ?? { title: "Passenger", icon: null };

	return (
		<div className="min-h-screen w-full bg-primary text-accent flex">
			<Sidebar role="passenger" />
			<div className="flex-1 flex flex-col">
				{showTopBar && <TopBar title={config.title} icon={config.icon} />}
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
