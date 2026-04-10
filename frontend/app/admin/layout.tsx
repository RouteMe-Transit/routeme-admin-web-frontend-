"use client";
import type { ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/config/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";
import { usePathname } from "next/navigation";

type AdminLayoutProps = {
	children: ReactNode;
};
type TopbarItem = {
	title: string;
	icon: ReactNode | null;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
	const pathname = usePathname();
	const showTopBar = pathname !== "/admin/profile";
	const configMap = topbarConfig as Record<string, TopbarItem>;
	const config = configMap[pathname] ?? { title: "Admin", icon: null };

	return (
		<div className="min-h-screen w-full bg-primary text-accent">
			<div className="flex min-h-screen">
				<Sidebar role="admin" />
				<div className="flex-1 flex flex-col">
					{showTopBar && <TopBar title={config.title} icon={config.icon} />}
					<main className="flex-1 ">{children}</main>
				</div>
			</div>
		</div>
	);
}
