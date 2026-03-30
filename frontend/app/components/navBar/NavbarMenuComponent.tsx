import { menuItems } from "./Navbar";
import NavbarItems from "./NavbarItemsComponent";

export default function NavbarMenu() {
    return (
        <nav className="shrink-0">
            <ul className=" w-[600px] items-center justify-between flex h-full text-base font-semibold text-white">
                {menuItems.map((item) => (
                    <NavbarItems key={item.name} item={item} />
                ))}
            </ul>
        </nav>
    )
}