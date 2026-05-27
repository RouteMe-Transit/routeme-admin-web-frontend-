'use client';
//landing page
import Navbar from "@/app/components/navBar/NavbarData";
import { FaCircle, FaPhone } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import Link from "next/link";
import LogoNname from "./components/logoNname/logoNname";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${API_URL}/test`)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          alert("✅ Backend Connected Successfully!");
        } else {
          alert("⚠️ Unexpected response");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Backend NOT Connected!");
      });
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <main className="w-full">
        <Navbar />

        <section className="overflow-hidden bg-[#183555] px-4 py-16 sm:px-6 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#50B18D]/30 bg-[#50B18D]/15 px-4 py-2 text-sm font-semibold text-green-100 shadow-sm">
                <FaCircle className="text-green-400 animate-pulse" />
                <span>Live Tracking Active</span>
              </div>
              <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find Your Bus.<br />Never wait <span className="text-[#50B18D]">Guessing</span> Again.
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-200 sm:text-lg">
                Real-time GPS bus tracking for Sri Lanka. Know exactly when your bus arrives, plan smarter routes, and stay informed with instant alerts.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/find-bus"
                  className="inline-flex w-full justify-center rounded-[10px] bg-[#50B18D] px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#3fa76b] sm:w-auto"
                >
                  Find Your Bus
                </Link>
                <Link
                  href="/find-bus"
                  className="inline-flex w-full justify-center rounded-[10px] border border-white/20 bg-[#183555]/90 px-6 py-4 text-sm font-bold text-white transition hover:bg-[#1e415f] sm:w-auto"
                >
                  Watch Demo
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 px-6 py-6 text-center text-white shadow-lg ring-1 ring-white/10">
                  <p className="text-4xl font-bold">247</p>
                  <p className="mt-2 text-sm text-slate-200">Active Buses</p>
                </div>
                <div className="rounded-3xl bg-white/10 px-6 py-6 text-center text-white shadow-lg ring-1 ring-white/10">
                  <p className="text-4xl font-bold">18</p>
                  <p className="mt-2 text-sm text-slate-200">Routes Covered</p>
                </div>
                <div className="rounded-3xl bg-white/10 px-6 py-6 text-center text-white shadow-lg ring-1 ring-white/10">
                  <p className="text-4xl font-bold">94%</p>
                  <p className="mt-2 text-sm text-slate-200">On-Time Rate</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F8F1] text-[#17A15C]">
                  <img src="/icons/gps.png" alt="GPS" className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Live GPS Tracking</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  See every bus location updated every 10 seconds and reduce uncertainty during your commute.
                </p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7FF] text-[#117CBF]">
                  <img src="/icons/fxemoji_bell.svg" alt="Alerts" className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Smart Alerts</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Receive instant notifications for delays, cancellations, and route changes so you can plan ahead.
                </p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F7FF] text-[#1C5AA4]">
                  <img src="/icons/map1.svg" alt="Route" className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Route Planner</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Find the best route from any stop to your destination with intuitive route guidance and arrival predictions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Real-time bus location</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">Track every bus on the map and get accurate arrival times for nearby stops.</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Alerts & updates</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">Stay notified when delays or route changes happen so you can adjust instantly.</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Easy route planning</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">Search stops, compare routes, and choose the fastest path to your destination.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-[#183555] px-4 py-10 text-white sm:px-6 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3">
            <div>
              <LogoNname />
              <p className="mt-4 max-w-md text-sm text-slate-300">
                Real-time GPS bus tracking built for Sri Lanka. Get there smarter, faster, and without the guesswork.
              </p>
            </div>
            <div className="grid gap-3">
              <p className="text-sm font-semibold uppercase text-slate-300">Navigate</p>
              <Link href="/" className="text-sm text-slate-100 hover:text-[#50B18D]">Home</Link>
              <Link href="/find-bus" className="text-sm text-slate-100 hover:text-[#50B18D]">Live Tracking</Link>
              <Link href="/routes" className="text-sm text-slate-100 hover:text-[#50B18D]">Routes</Link>
              <Link href="/news" className="text-sm text-slate-100 hover:text-[#50B18D]">News</Link>
              <Link href="/contact" className="text-sm text-slate-100 hover:text-[#50B18D]">Contact</Link>
            </div>
            <div className="grid gap-3">
              <p className="text-sm font-semibold uppercase text-slate-300">Contact Us</p>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <FaLocationDot className="text-[#50B18D]" />
                <span>Email: info@routeme.lk</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <FaPhone className="text-[#50B18D]" />
                <span>Phone: +94 123 456 789</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-200">
                <FaLocationDot className="mt-1 text-[#50B18D]" />
                <span>Address: 123 Main Street, Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 RouteMe. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="hover:text-[#50B18D]">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[#50B18D]">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
