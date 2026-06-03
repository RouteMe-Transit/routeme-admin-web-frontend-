"use client";
import React from "react";
import { RouteSummary } from "../../services/routeService";

type Props = {
  routes: RouteSummary[];
  onSelect: (id: string) => void;
};

export default function SuggestedRoutes({ routes, onSelect }: Props) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Suggested Routes</h3>
      <div className="space-y-3">
        {routes.map((r) => (
          <div
            key={r.id}
            role="button"
            onClick={() => onSelect(r.id)}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
              r.highlight ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">🚌</div>
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-gray-500">{r.subtitle}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{r.time}</div>
              <div className="text-xs text-gray-500">{r.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
