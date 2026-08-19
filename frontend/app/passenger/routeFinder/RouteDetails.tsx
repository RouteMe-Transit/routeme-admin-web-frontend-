"use client";
import React, { useEffect, useState } from "react";
import { RouteDetails as RD, getRouteDetails } from "../../services/routeService";

type Props = {
  routeId?: string | null;
};

export default function RouteDetails({ routeId }: Props) {
  const [details, setDetails] = useState<RD | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!routeId) return setDetails(null);
      setLoading(true);
      try {
        const d = await getRouteDetails(routeId);
        if (mounted) setDetails(d);
      } catch (e) {
        if (mounted) setDetails(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [routeId]);

  if (!routeId) return null;

  return (
    <div className="bg-white rounded-lg p-3 md:p-6 shadow-sm mt-3 md:mt-6">
      {loading && <div className="text-xs md:text-sm text-gray-500">Loading details...</div>}
      {!loading && details && (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <div className="font-semibold text-sm md:text-base">{details.title}</div>
              <div className="text-xs md:text-sm text-gray-500">Route overview</div>
            </div>
            <div className="text-right text-xs md:text-sm text-gray-500">{details.stops[0]?.time ?? ""}</div>
          </div>

          <div className="mt-3 md:mt-4">
            {details.stops.map((s, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 py-2 md:py-3 border-b last:border-b-0">
                <div className="w-5 md:w-6 h-5 md:h-6 rounded-full bg-teal-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs md:text-sm truncate">{s.name}</div>
                </div>
                <div className="text-xs md:text-sm text-teal-600 flex-shrink-0">{s.time}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
