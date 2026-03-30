import type { ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";

type AdminLayoutProps = {
	children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
	return (
		<div className="min-h-screen w-full bg-primary text-accent">
			<div className="flex min-h-screen">
				<Sidebar role="admin" />
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
