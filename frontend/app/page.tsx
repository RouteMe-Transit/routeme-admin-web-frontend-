//landing page
import NavBar from "@/app/components/navBar/navBar";
import { FaCircle, FaMapPin, FaBell, FaPhone} from "react-icons/fa";
import { FaMapLocationDot, FaLocationDot } from "react-icons/fa6";
import Link from "next/link";
import LogoNname from "./components/logoNname/logoNname";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <main className="w-full">
        <NavBar />
        <div className="h-151.5 w-full bg-accent relative">

          <div className="bg-secondary/30 border border-secondary text-base text-green-500 font-bold w-[300px] h-[40px] rounded-[20px] ml-10 items-center justify-center flex mt-10 absolute">
            <FaCircle className="text-green-500 mr-5 animate-pulse" />
            <h1>Live Tracking Active</h1>
          </div>
          <div className="absolute top-30 left-10 w-[1200px] h-[200px]">
            <p className="text-white font-extrabold text-7xl  ">Find Your Bus.<br/>Never wait <span className="text-secondary">Guessing </span>Again.</p>
          </div>
          <div className="absolute top-80 left-10">
            <p className="text-ashcolor text-lg">Real-time GPS bus tracking for Sri Lanka. Know exactly when<br/>your bus arrives, plan smarter routes, and stay informed with<br/>instant alerts.</p>
          </div>

          <div className=" h-[60px] w-[400px] gap-15 flex absolute top-110 left-10">
            <Link href="/find-bus" className="inline-flex bg-secondary text-white font-bold py-2 px-4 rounded-[10px] w-[155px] h-[53px] items-center justify-center">
              Find Your Bus
            </Link>
            <Link href="/find-bus" className="inline-flex bg-accent border border-ashcolor text-white font-bold py-2 px-4 rounded-[10px] w-[155px] h-[53px] items-center justify-center">
              Watch Demo
            </Link>

          </div>

          <div className="flex justify-center items-center gap-10 absolute top-130 left-10">
            <div className="text-center">
              <p className="text-white font-bold text-5xl">247</p>
              <p className="text-ashcolor ">Active Buses</p>
            </div>
            <div className="h-14 w-px bg-white/30" />
            <div className="text-center">
            <p className="text-white font-bold text-5xl">18</p>
            <p className="text-ashcolor ">Route Covered</p>
          </div>
          <div className="h-14 w-px bg-white/30" />
          <div className="text-center">
            <p className="text-white font-bold text-5xl">94%</p>
            <p className="text-ashcolor ">On-Time Rate</p>
          </div>
          </div>
        </div>
		
        <div className="w-full h-[323px] flex items-center justify-center gap-10 border">
			<div className="bg-white w-[440px] h-[250px] rounded-[10px] border border-ashcolor/30">
            <div className="ml-10 mt-10 gap-5 flex-col">
              <FaMapPin className="text-red-500 text-5xl" /><br/>
              <p className="text-3xl font-bold">Live GPS Tracking</p>
			  
              <p className="text-ashcolor text-lg mt-2">See every bus location<br/> updated every 10 seconds.</p>
            </div>
			</div>
			<div className="bg-white w-[440px] h-[250px] rounded-[10px] border border-ashcolor/30">
            <div className="ml-10 mt-10 gap-5 flex-col">
              <FaBell className="text-yellow-500 text-5xl" /><br/>
              <p className="text-3xl font-bold">Smart Alerts</p>
			  
              <p className="text-ashcolor text-lg mt-2">Get notified instantly about delays and cancellations.</p>
            </div>
			</div>
			<div className="bg-white w-[440px] h-[250px] rounded-[10px] border border-ashcolor/30">
            <div className="ml-10 mt-10 gap-5 flex-col">
              <FaMapLocationDot className="text-green-500 text-5xl" />
			  <br/>
              <p className="text-3xl font-bold">Route Planner</p>
			  
              <p className="text-ashcolor text-lg mt-2">Find the best route from any stop to your destination.</p>
            </div>
			</div>
        </div>
	
    <div className="relative w-full h-[320px] border bg-accent pt-5 pl-5 flex ">

			<div className=" w-[400px]">
				<LogoNname/>
				<p className="text-white ml-5 mt-3 text-base">Real-time GPS bus tracking built for<br/>Sri Lanka. Get there smarter, faster, and<br/>without the guesswork.</p>
			</div>

			<div className=" flex flex-col gap-2 ml-80">
				<p className="text-white font-bold text-base mb-4">NAVIGATE</p>
				<Link href="/" className="text-white text-sm hover:text-secondary">Home</Link>
				<Link href="/find-bus" className="text-white text-sm hover:text-secondary">Live Tracking</Link>
				<Link href="/routes" className="text-white text-sm hover:text-secondary">Routes</Link>
				<Link href="/news" className="text-white text-sm hover:text-secondary">News</Link>
				<Link href="/contact" className="text-white text-sm hover:text-secondary">Contact</Link>
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
    <Link href="/privacy" className="text-white hover:text-secondary ml-180">Privacy Policy</Link>
    <Link href="/terms" className="text-white hover:text-secondary ml-10">Terms of Service</Link>
    </div>

	</div>
       
      </main>
    </div>
  );
}
