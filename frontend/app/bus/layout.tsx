import type { ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";

type BusLayoutProps = {
	children: ReactNode;
};

export default function BusLayout({ children }: BusLayoutProps) {
	return (
		<div className="min-h-screen w-full bg-primary text-accent">
			<div className="flex min-h-screen">
				<Sidebar role="bus" />
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
