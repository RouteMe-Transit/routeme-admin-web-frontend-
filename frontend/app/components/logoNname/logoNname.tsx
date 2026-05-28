import Image from "next/image";
export default function LogoNname() {
    return (
        <div className="flex min-w-0 items-center gap-3 px-2 py-1">
            <Image src="/routeMeLogo.svg" alt="RouteMe Logo" width={100} height={100} className="w-12 h-12 rounded-lg" />
            <div className="flex flex-col leading-none">
                <span className="text-2xl font-bold text-white">Route</span>
                <span className="text-2xl font-bold text-[#4CAF8A]">Me</span>
            </div>
        </div>
    );
}

    