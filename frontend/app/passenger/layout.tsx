import type { ReactNode } from "react";
import Sidebar from "../components/sideBar/Sidebar";

type PassengerLayoutProps = {
	children: ReactNode;
};

export default function PassengerLayout({ children }: PassengerLayoutProps) {
	return (
		<div className="min-h-screen w-full bg-primary text-accent">
			<div className="flex min-h-screen">
				<Sidebar role="passenger" />
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
