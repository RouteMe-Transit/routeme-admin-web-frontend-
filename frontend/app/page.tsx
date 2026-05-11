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

    fetch(`${API_URL}/test`).then((res) => {
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
    <div className="min-h-screen w-full">
      <main className="w-full">
        <Navbar />
        <div className="h-151.5 w-full bg-[#183555] relative">

          <div className="bg-[#50B18D]/30 border border-[#50B18D] text-base text-green-500 font-bold w-[300px] h-[40px] rounded-[20px] ml-10 items-center justify-center flex mt-10 absolute">
            <FaCircle className="text-green-500 mr-5 animate-pulse" />
            <h1>Live Tracking Active</h1>
          </div>
          <div className="absolute top-30 left-10 w-[1200px] h-[200px]">
            <p className="text-white font-extrabold text-7xl  ">Find Your Bus.<br />Never wait <span className="text-[#50B18D]">Guessing </span>Again.</p>
          </div>
          <div className="absolute top-80 left-10">
            <p className="text-[#94A0AE] text-lg">Real-time GPS bus tracking for Sri Lanka. Know exactly when<br />your bus arrives, plan smarter routes, and stay informed with<br />instant alerts.</p>
          </div>

          <div className=" h-[60px] w-[400px] gap-15 flex absolute top-110 left-10">
            <Link href="/find-bus" className="inline-flex bg-[#50B18D] text-white font-bold py-2 px-4 rounded-[10px] w-[155px] h-[53px] items-center justify-center">
              Find Your Bus
            </Link>
            <Link href="/find-bus" className="inline-flex bg-[#183555] border border-[#94A0AE] text-white font-bold py-2 px-4 rounded-[10px] w-[155px] h-[53px] items-center justify-center">
              Watch Demo
            </Link>

          </div>

          <div className="flex justify-center items-center gap-10 absolute top-130 left-10">
            <div className="text-center">
              <p className="text-white font-bold text-5xl">247</p>
              <p className="text-[#94A0AE] ">Active Buses</p>
            </div>
            <div className="h-14 w-px bg-white/30" />
            <div className="text-center">
              <p className="text-white font-bold text-5xl">18</p>
              <p className="text-[#94A0AE] ">Route Covered</p>
            </div>
            <div className="h-14 w-px bg-white/30" />
            <div className="text-center">
              <p className="text-white font-bold text-5xl">94%</p>
              <p className="text-[#94A0AE] ">On-Time Rate</p>
            </div>
          </div>
        </div>

        <div className="w-full h-[323px] flex items-center justify-center gap-10 border">
          <div className="bg-white w-[440px] h-[250px] rounded-[10px] border border-[#94A0AE]/30">
            <div className="ml-10 mt-10 gap-5 flex-col">
              <img src="/icons/gps.png" alt="Map" className="w-15 h-15" /><br />
              <p className="text-3xl font-bold">Live GPS Tracking</p>

              <p className="text-[#94A0AE] text-lg mt-2">See every bus location<br /> updated every 10 seconds.</p>
            </div>
          </div>
          <div className="bg-white w-[440px] h-[250px] rounded-[10px] border border-[#94A0AE]/30">
            <div className="ml-10 mt-10 gap-5 flex-col">
              <img src="/icons/fxemoji_bell.svg" alt="Map" className="w-15 h-15" /><br />
              <p className="text-3xl font-bold">Smart Alerts</p>

              <p className="text-[#94A0AE] text-lg mt-2">Get notified instantly about delays and cancellations.</p>
            </div>
          </div>
          <div className="bg-white w-[440px] h-[250px] rounded-[10px] border border-[#94A0AE]/30">
            <div className="ml-10 mt-10 gap-5 flex-col">
              <img src="/icons/map1.svg" alt="Map" className="w-15 h-15" />
              <br />
              <p className="text-3xl font-bold">Route Planner</p>

              <p className="text-[#94A0AE] text-lg mt-2">Find the best route from any stop to your destination.</p>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[320px] border bg-[#183555] pt-5 pl-5 flex ">

          <div className=" w-[400px]">
            <LogoNname />
            <p className="text-white ml-5 mt-3 text-base">Real-time GPS bus tracking built for<br />Sri Lanka. Get there smarter, faster, and<br />without the guesswork.</p>
          </div>

          <div className=" flex flex-col gap-2 ml-80">
            <p className="text-white font-bold text-base mb-4">NAVIGATE</p>
            <Link href="/" className="text-white text-sm hover:text-[#50B18D]">Home</Link>
            <Link href="/find-bus" className="text-white text-sm hover:text-[#50B18D]">Live Tracking</Link>
            <Link href="/routes" className="text-white text-sm hover:text-[#50B18D]">Routes</Link>
            <Link href="/news" className="text-white text-sm hover:text-[#50B18D]">News</Link>
            <Link href="/contact" className="text-white text-sm hover:text-[#50B18D]">Contact</Link>
          </div>

          <div className="flex flex-col gap-2 w-[300px] ml-70">

            <p className="text-white font-bold text-base mb-4">CONTACT US</p>
            <div className="flex items-center gap-2">
              <FaLocationDot className="text-white" />
              <p className="text-white text-sm">Email: info@routeme.lk</p>
            </div>
            <div className="flex items-center gap-2">
              <FaPhone className="text-white" />
              <p className="text-white text-sm">Phone: +94 123 456 789</p>
            </div>
            <div className="flex items-center gap-2">
              <FaLocationDot className="text-white" />
              <p className="text-white text-sm">Address: 123 Main Street, Colombo, Sri Lanka</p>
            </div>
          </div>
          <div className="absolute bottom-15 left-25 h-px w-[1200px] bg-white/40 items-center" />

          <div className="absolute bottom-6 left-25 flex w-[1200px] items-center text-sm">
            <p className="text-white">© 2026 RouteMe. All rights reserved.</p>
            <Link href="/privacy" className="text-white hover:text-[#50B18D] ml-180">Privacy Policy</Link>
            <Link href="/terms" className="text-white hover:text-[#50B18D] ml-10">Terms of Service</Link>
          </div>

        </div>

      </main>
    </div>
  );
}
