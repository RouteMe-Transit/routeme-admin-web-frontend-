import Image from "next/image";
export default function LogoNname() {
    return (
        <div className="w-[385px] h-[87px]  items-center gap-0 inline-flex ">
            <Image src="/routeMeLogo.svg" alt="RouteMe Logo" width={100} height={100} className="w-[64px] h-[60px] rounded-lg m-3 ml-6"/>
            <div className="flex gap-0 items-center justify-center">
                <div className="text-3xl font-bold text-white ">Route</div>
                <div className="text-3xl font-bold text-[#4CAF8A]">Me</div>
            </div>
        </div>
    );
}

    