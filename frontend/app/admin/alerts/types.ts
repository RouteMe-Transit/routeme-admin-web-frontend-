import type { AlertTypeValue } from "@/config/alertTypes";

export type AlertHistoryStatus = "published" | "scheduled";

export type AlertHistoryItem = {
    id: number;
    title: string;
    description: string;
    type: AlertTypeValue;
    status: AlertHistoryStatus;
    targetAudience: string;
    affectedRoute: string;
    timestamp: string;
    scheduledAt?: string;
};
