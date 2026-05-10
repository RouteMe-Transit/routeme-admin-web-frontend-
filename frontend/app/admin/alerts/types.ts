import type { AlertTypeValue } from "@/config/alertTypes";

export type AlertHistoryStatus = "published" | "scheduled";

export type CreatedBy = {
    type: "admin" | "bus" | string;
    id: string;
    name: string;
};

export type AlertHistoryItem = {
    id: number;
    title: string;
    description: string;
    type: AlertTypeValue;
    status: AlertHistoryStatus;
    targetAudience: string;
    affectedRoute: string;
    affectedBus?: string;
    timestamp: string;
    scheduledAt?: string;
    sentAt?: string;
    createdBy?: CreatedBy;
};
