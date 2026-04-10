import Link from "next/link";
import LogoNname from "../logoNname/logoNname";
import NavbarMenu from "./NavbarMenuComponent";

export default function Navbar() {
    return (
        <div className="sticky top-0 z-50 flex h-[87px] w-full items-center bg-[#183555] shadow-lg px-6">
            <LogoNname />
            <NavbarMenu />
            <div className="ml-auto mr-4 flex h-full shrink-0 items-center justify-end gap-4">
                <Link href="/login" className="h-[44px] w-[126px] bg-[#183555] border  border-white/50 text-white font-semibold text-base rounded-[10px] flex items-center justify-center hover:bg-white/10">Log In</Link>
                <Link href="/signUp" className="w-[143px] h-[44px] text-white font-semibold text-base ml-4 bg-[#50B18D]  rounded-[10px] border border-[#50B18D]/50 items-center justify-center flex hover:bg-[#50B18D]/50">Get Started</Link>

            </div>
        </div>
    )
}
