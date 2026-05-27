import { menuItems } from "./Navbar";
import NavbarItems from "./NavbarItemsComponent";

export default function NavbarMenu() {
    return (
        <nav className="w-full">
            <ul className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 text-base font-semibold text-white">
                {menuItems.map((item) => (
                    <NavbarItems key={item.name} item={item} />
                ))}
            </ul>
        </nav>
    )
}