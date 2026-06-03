"use client";
import React, { useState } from "react";
import RouteSearch from "./RouteSearch";
import SuggestedRoutes from "./SuggestedRoutes";
import RouteDetails from "./RouteDetails";
import CalendarPlaceholder from "./CalendarPlaceholder";

import { RouteSummary, searchRoutes } from "../../services/routeService";

export default function PassengerRouteFinderPage() {
    const [routes, setRoutes] = useState<RouteSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined | null>(null);

    async function handleSearch(from: string, to: string) {
        setLoading(true);
        setSelectedId(null);
        try {
            const results = await searchRoutes({ from, to });
            setRoutes(results);
            if (results.length) setSelectedId(results[0].id);
        } catch (e) {
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen p-6 bg-gray-100">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Route Finder</h1>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8 space-y-4">
                        <RouteSearch onSearch={handleSearch} />
                        {loading ? (
                            <div className="p-6 bg-white rounded-lg">Searching...</div>
                        ) : (
                            <SuggestedRoutes routes={routes} onSelect={setSelectedId as any} />
                        )}

                        <RouteDetails routeId={selectedId} />
                    </div>

                    <aside className="col-span-4">
                        <CalendarPlaceholder selected={selectedDate ?? undefined} onSelect={setSelectedDate} />
                        {selectedDate && (
                            <div className="mt-3 text-sm text-gray-600">Selected: {selectedDate.toDateString()}</div>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}