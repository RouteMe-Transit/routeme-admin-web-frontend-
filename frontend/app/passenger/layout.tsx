"use client";
import type { ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/app/components/topBar/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";
import { usePathname } from "next/navigation";
import {
	PassengerThemeProvider,
	usePassengerTheme,
} from "./PassengerThemeContext";
import AuthGuard from "./AuthGuard";

type PassengerLayoutProps = {
	children: ReactNode;
};

type TopbarItem = {
	title: string;
	icon: ReactNode | null;
};

export default function PassengerLayout({ children }: PassengerLayoutProps) {
	return (
		<AuthGuard>
			<PassengerThemeProvider>
				<PassengerLayoutContent>{children}</PassengerLayoutContent>
			</PassengerThemeProvider>
		</AuthGuard>
	);
}

function PassengerLayoutContent({ children }: PassengerLayoutProps) {
	const pathname = usePathname();
	const { theme } = usePassengerTheme();
	const showTopBar = pathname !== "/passenger/profile";
	const configMap = topbarConfig as Record<string, TopbarItem>;
	const config = configMap[pathname] ?? { title: "Passenger", icon: null };

	return (
		<div
			data-theme={theme}
			className="passenger-theme flex h-dvh w-full overflow-hidden bg-primary text-accent"
		>
			<Sidebar role="passenger" />
			<div className="flex-1 min-w-0 flex flex-col overflow-hidden">
				{showTopBar && <TopBar title={config.title} icon={config.icon} />}
				<main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
			</div>
		</div>
	);
}
