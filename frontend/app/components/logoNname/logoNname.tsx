import Image from "next/image";
export default function LogoNname() {
    return (
        <div className="flex items-center gap-3 min-w-0">
            <Image
                src="/routeMeLogo.svg"
                alt="RouteMe Logo"
                width={100}
                height={100}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0"
            />

            <div className="flex items-center leading-none whitespace-nowrap">
                <span className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">Route</span>
                <span className="text-lg sm:text-2xl font-extrabold text-[#4CAF8A] ml-1 tracking-tight">Me</span>
            </div>
        </div>
    );
}

    