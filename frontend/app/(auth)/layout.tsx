import type { ReactNode } from "react";
import LogoNname from "../components/logoNname/logoNname";

type AuthLayoutProps = {
	children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="relative min-h-screen">
			<div className="absolute top-0 left-0 h-[87px] w-full  bg-[#183555] sticky" ><LogoNname/></div>
            
			<div className="pt-16">{children}</div>
		</div>
	);
}
