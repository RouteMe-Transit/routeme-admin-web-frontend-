
import { FaLongArrowAltRight } from "react-icons/fa";

export default function BusProfilePage() {
    const bus = {
  type: "Semi Luxury",
  route: "138",
  origin: "Homagama",
  destination: "Pettah",
  seats: 45,
  busId: "NA-1879",
  registrationNumber: "WP NA-1879",
  finishedTripsToday: 6,
  profilePicture: "/icons/bus.png",
};
    return (
        <section className="space-y-2">
            <div className="flex items-center justify-center">
                <div className="w-[700px] h-[270px] bg-white mt-10 rounded-2xl flex items-center justify-center flex-col">
                    <img src={bus.profilePicture} alt="Bus Profile" className="w-20 h-20 mr-6 border rounded-full" />
                    <h2 className="text-2xl font-bold mb-2">{bus.registrationNumber}</h2>
                    <div className="flex flex-row gap-4">
                        <p className="font-semibold bg-[#D9D9D980] border w-[120px] h-[37px] flex items-center justify-center rounded-full border-black/30">{bus.type}</p>
                        <p className="font-semibold bg-[#D9D9D980] border w-[120px] h-[37px] flex items-center justify-center rounded-full border-black/30">{bus.route} Route</p>
                        <p className="font-semibold bg-[#D9D9D980] border w-[120px] h-[37px] flex items-center justify-center rounded-full border-black/30">{bus.seats} Seats</p>
                    </div>

                </div>
            </div>
            <h3 className="text-md font-bold text-[#94A0AE] ml-10 mt-10">BUS DETAILS</h3>

            <div className="flex flex-row gap-5 h-80 items-center justify-center">
                <div className="flex flex-col gap-4 mt-[-70px]">
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Bus Number</p>
                    <p className="text-black font-semibold">{bus.registrationNumber}</p>
                </div>
                
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Total Seats</p>
                    <p className="text-black font-semibold">{bus.seats}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="flex text-[#94A0AE] font-semibold gap-1 items-center">Origin <FaLongArrowAltRight size={10}/>Dest.</p>
                    <p className="flex text-black font-semibold gap-1 items-center">{bus.origin} <FaLongArrowAltRight size={10}/> {bus.destination}</p>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Registration</p>
                    <p className="text-black font-semibold">{bus.registrationNumber}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Type</p>
                    <p className="text-black font-semibold">{bus.type}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Assigned Route</p>
                    <p className="text-black font-semibold">{bus.route}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className=" text-[#94A0AE] font-semibold ">Today's Trips</p>
                    <p className=" text-black font-semibold">{bus.finishedTripsToday}</p>
                </div>
            </div>
            </div>
        </section>
    );
}