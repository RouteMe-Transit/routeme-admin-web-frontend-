"use client";
import React from "react";
import { RouteSummary } from "../../services/routeService";

type Props = {
  routes: RouteSummary[];
  onSelect: (id: string) => void;
};

export default function SuggestedRoutes({ routes, onSelect }: Props) {
  return (
    <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm">
      <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Suggested Routes</h3>
      <div className="space-y-2 md:space-y-3">
        {routes.map((r) => (
          <div
            key={r.id}
            role="button"
            onClick={() => onSelect(r.id)}
            className={`flex flex-col md:flex-row md:items-center md:justify-between p-2 md:p-3 rounded-lg border cursor-pointer ${
              r.highlight ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="h-8 md:h-10 w-8 md:w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 text-lg md:text-xl">🚌</div>
              <div className="min-w-0">
                <div className="font-medium text-xs md:text-sm truncate">{r.title}</div>
                <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
              </div>
            </div>
            <div className="text-right mt-2 md:mt-0">
              <div className="font-semibold text-sm md:text-base">{r.time}</div>
              <div className="text-xs text-gray-500">{r.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
