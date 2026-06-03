"use client";
import React, { useState } from "react";

type Props = {
  onSearch: (from: string, to: string) => void;
};

export default function RouteSearch({ onSearch }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("Veyangoda Station");

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-ashcolor">Starting Location</label>
          <input value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-md p-2" placeholder="Starting Location" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm text-ashcolor">Destination</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-md p-2 w-full" placeholder="Veyangoda Station" />
          </div>
          <button className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" onClick={() => { const tmp = from; setFrom(to); setTo(tmp); }}>⇅</button>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-teal-500 text-white px-4 py-2 rounded-full" onClick={() => onSearch(from, to)}>Find Routes</button>
          <button className="border px-4 py-2 rounded-full" onClick={() => onSearch(from, to)}>Now</button>
        </div>
      </div>
    </div>
  );
}
