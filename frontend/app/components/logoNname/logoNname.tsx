import Image from "next/image";
export default function LogoNname() {
    return (
        <div className="w-[385px] h-[87px]justify-center items-center gap-0 inline-flex">
            <Image src="/routeMeLogo.svg" alt="RouteMe Logo" width={100} height={100} className="w-[50px] h-[50px] rounded-lg m-3 ml-6"/>
            <div className="flex gap-0 items-center justify-center">
                <div className="text-2xl font-bold text-white ">Route</div>
                <div className="text-2xl font-bold text-secondary">Me</div>
            </div>
        </div>
    );
}

    