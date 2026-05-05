"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import Sidebar from "../components/sideBar/Sidebar";
import { topbarConfig } from "@/app/components/topBar/topbarConfig";
import TopBar from "@/app/components/topBar/Topbar";
import { usePathname } from "next/navigation";
import { AdminThemeProvider, useAdminTheme } from "./AdminThemeContext";

type AdminLayoutProps = {
  children: ReactNode;
};

type TopbarItem = {
  title: string;
  icon: ReactNode | null;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
	return (
		<AdminThemeProvider>
			<AdminLayoutContent>{children}</AdminLayoutContent>
		</AdminThemeProvider>
	);
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
	const pathname = usePathname();
	const { theme } = useAdminTheme();
	const showTopBar = pathname !== "/admin/profile";
	const configMap = topbarConfig as Record<string, TopbarItem>;
	const config = configMap[pathname] ?? { title: "Admin", icon: null };

	return (
		<div data-theme={theme} className="admin-theme min-h-screen w-full bg-primary text-accent">
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
