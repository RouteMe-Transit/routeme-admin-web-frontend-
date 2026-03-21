import Link from "next/link";
import LogoNname from "../logoNname/logoNname";
import NavBarMenu from "./navBarMenu";

export default function NavBar() {
    return (
        <div className="sticky top-0 z-50 flex h-[87px] w-full items-center bg-accent shadow-[0_1px_2px_rgba(255,255,255,0.35)]">
            <LogoNname />
            <NavBarMenu />
            <div className="ml-auto mr-4 flex h-full shrink-0 items-center justify-end gap-4">
                <Link href="/login" className="h-[44px] w-[126px] bg-accent border  border-white/50 text-white font-semibold text-base rounded-[10px] flex items-center justify-center hover:bg-white/10">Log In</Link>
                <Link href="/signUp" className="w-[143px] h-[44px] text-white font-semibold text-base ml-4 bg-secondary  rounded-[10px] border border-secondary/50 items-center justify-center flex hover:bg-secondary/50">Get Started</Link>

            </div>
        </div>
    )
}