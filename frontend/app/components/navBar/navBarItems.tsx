import Link from "next/link";

type NavItem = {
    name: string;
    path: string;
};

type NavBarItemsProps = {
    item: NavItem;
};

export default function NavBarItems({ item }: NavBarItemsProps) {
    return (
            <li className=" text-secondary text-base font-semibold hover:text-white">
                <Link href={item.path}>{item.name}</Link>
            </li>
    )
}