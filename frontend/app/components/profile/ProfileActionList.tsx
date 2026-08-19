// This component renders a list of profile action items, such as "Edit Profile", "Change Password", etc. Each item can have an optional onClick handler and can be styled as a danger action (e.g., "Delete Account").
"use client";

type ProfileActionItem = {
    id: string;
    label: string;
    iconSrc: string;
    iconAlt: string;
    onClick?: () => void;
    danger?: boolean;
};

type ProfileActionListProps = {
    items: ProfileActionItem[];
    className?: string;
};

export type { ProfileActionItem };

export default function ProfileActionList({
    items,
    className = "flex flex-col items-center mt-10",
}: ProfileActionListProps) {
    return (
        <div className={className}>
            {items.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === items.length - 1;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className={[
                            "w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 hover:bg-gray-200",
                            !isLast ? "border-b border-gray-300" : "",
                            isFirst ? "rounded-t-md" : "",
                            isLast ? "rounded-b-md" : "",
                            item.danger ? "text-red-600" : "",
                        ].join(" ")}
                    >
                        <img src={item.iconSrc} alt={item.iconAlt} className="inline-block w-8 h-8 mr-5" />
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
