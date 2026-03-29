import { menuItems } from "./navBarData";
import NavBarItems from "./navBarItems";

export default function NavBarMenu(){
    return (
        <nav className="shrink-0">
            <ul className=" w-[600px] items-center justify-between flex h-full text-base font-semibold text-white">
                {menuItems.map((item) => (
                    <NavBarItems key={item.name} item={item} />
                ))}
            </ul>
        </nav>
    )
}