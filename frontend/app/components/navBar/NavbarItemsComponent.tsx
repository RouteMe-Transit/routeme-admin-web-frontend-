import Link from "next/link";

type NavItem = {
    name: string;
    path: string;
};

type NavbarItemsProps = {
    item: NavItem;
};

export default function NavbarItems({ item }: NavbarItemsProps) {
    return (
            <li className=" text-[#50B18D] text-base font-semibold hover:text-white">
                <Link href={item.path}>{item.name}</Link>
            </li>
    )
}