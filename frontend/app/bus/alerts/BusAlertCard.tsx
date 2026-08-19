"use client";

import type { BusAlertType } from "@/config/passengerAlerts";

type BusAlertCardColor = {
    cardBorder: string;
    titleText: string;
    buttonBg: string;
    buttonHover: string;
    historyRow: string;
};

type BusAlertCardProps = {
    type: BusAlertType;
    label: string;
    iconSrc: string;
    color: BusAlertCardColor;
    onSend: (type: BusAlertType) => void;
};

export default function BusAlertCard({ type, label, iconSrc, color, onSend }: BusAlertCardProps) {
    return (
        <article
            className={`bus-alert-card flex w-full max-w-full sm:w-[293.069px] sm:h-[216.891px] flex-col rounded-2xl border bg-[#FFFFFF] p-4 shadow-sm transition hover:shadow-md ${color.cardBorder}`}
        >
            <h3 className={`w-full text-center text-base font-bold ${color.titleText}`}>{label}</h3>

            <div className="flex flex-1 items-center justify-center">
                <img src={iconSrc} alt={label} className="h-10 w-10 sm:h-14 sm:w-14 object-contain" />
            </div>

            <button
                type="button"
                onClick={() => onSend(type)}
                className={`bus-alert-send-button mx-auto w-full sm:w-[145.377px] h-[30.663px] rounded-xl text-sm font-bold text-[#4B5563] transition ${color.buttonBg} ${color.buttonHover} ${type === "Not-Operating" ? "bus-alert-send-button-not-operating" : ""}`}
            >
                Send Alert
            </button>
        </article>
    );
}
