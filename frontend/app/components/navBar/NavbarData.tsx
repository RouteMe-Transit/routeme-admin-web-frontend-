"use client";

import Link from "next/link";
import LogoNname from "../logoNname/logoNname";
import NavbarMenu from "./NavbarMenuComponent";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="sticky top-0 z-50 w-full bg-[#183555] shadow-lg">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                {/* Logo */}
                <div className="flex min-w-0 items-center gap-3">
                    <LogoNname />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex md:items-center md:flex-1 md:gap-8">
                    <NavbarMenu />
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex md:gap-3 md:ml-auto">
                    <Link href="/login" className="min-w-[120px] rounded-[10px] border border-white/50 bg-[#183555] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/10">
                        Log In
                    </Link>
                    <Link href="/signUp" className="min-w-[120px] rounded-[10px] bg-[#50B18D] px-4 py-2 text-center text-sm font-semibold text-white border border-[#50B18D]/50 hover:bg-[#50B18D]/50">
                        Get Started
                    </Link>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-lg transition"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <FiX className="w-6 h-6" />
                    ) : (
                        <FiMenu className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[#0f2438] border-t border-white/10 px-4 py-4">
                    <NavbarMenu />
                    <div className="mt-4 flex flex-col gap-2">
                        <Link href="/login" className="w-full rounded-[10px] border border-white/50 bg-[#183555] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white/10 transition">
                            Log In
                        </Link>
                        <Link href="/signUp" className="w-full rounded-[10px] bg-[#50B18D] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#3fa76b] transition">
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
