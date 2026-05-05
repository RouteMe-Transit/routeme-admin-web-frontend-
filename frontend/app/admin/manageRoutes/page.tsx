"use client";

import { useState, useMemo } from "react";
import Swal from "sweetalert2";

// ── Types ─────────────────────────────────────────────────────────────────────
type RouteStatus = "Active" | "Maintenance" | "Breakdown";

type Stop = {
  id: string;
  name: string;
  timeFromStart: string;
};

type Route = {
  id: string;
  name: string;
  from: string;
  to: string;
  stops: number;
  buses: number;
  avgTime: string;
  status: RouteStatus;
  stopList: Stop[];
};

// ── Predefined stop catalogue ─────────────────────────────────────────────────
const PREDEFINED_STOPS: { name: string; zone: string }[] = [
  { name: "Colombo Fort",          zone: "Colombo" },
  { name: "Slave Island",          zone: "Colombo" },
  { name: "Kollupitiya",           zone: "Colombo" },
  { name: "Bambalapitiya",         zone: "Colombo" },
  { name: "Wellawatte",            zone: "Colombo" },
  { name: "Maradana",              zone: "Colombo" },
  { name: "Borella",               zone: "Colombo" },
  { name: "Narahenpita",           zone: "Colombo" },
  { name: "Kirula",                zone: "Colombo" },
  { name: "Rajagiriya",            zone: "Colombo" },
  { name: "Kotte",                 zone: "Sri Jayawardenepura" },
  { name: "Battaramulla",          zone: "Sri Jayawardenepura" },
  { name: "Battaramulla South",    zone: "Sri Jayawardenepura" },
  { name: "Pitakotte",             zone: "Sri Jayawardenepura" },
  { name: "Welikade",              zone: "Sri Jayawardenepura" },
  { name: "Dehiwala",              zone: "Southern Suburbs" },
  { name: "Mount Lavinia",         zone: "Southern Suburbs" },
  { name: "Ratmalana",             zone: "Southern Suburbs" },
  { name: "Nugegoda",              zone: "Southern Suburbs" },
  { name: "Gangodawila",           zone: "Southern Suburbs" },
  { name: "Maharagama",            zone: "Southern Suburbs" },
  { name: "Boralesgamuwa",         zone: "Southern Suburbs" },
  { name: "Kesbewa Road",          zone: "Southern Suburbs" },
  { name: "Piliyandala Junction",  zone: "Piliyandala" },
  { name: "Piliyandala",           zone: "Piliyandala" },
  { name: "Bandaragama Junction",  zone: "Piliyandala" },
  { name: "Bandaragama",           zone: "Piliyandala" },
  { name: "Nagoda",                zone: "Piliyandala" },
  { name: "Kesbewa",               zone: "Kesbewa" },
  { name: "Kahathuduwa",           zone: "Kesbewa" },
  { name: "Homagama",              zone: "Homagama" },
  { name: "Godagama",              zone: "Homagama" },
  { name: "Thalawathugoda",        zone: "Homagama" },
  { name: "Hokandara",             zone: "Homagama" },
  { name: "Athurugiriya",          zone: "Malabe" },
  { name: "Malabe",                zone: "Malabe" },
  { name: "Koswatta",              zone: "Malabe" },
  { name: "Hanwella Junction",     zone: "Hanwella" },
  { name: "Padukka",               zone: "Hanwella" },
  { name: "Awissawella Road",      zone: "Hanwella" },
  { name: "Ingiriya Junction",     zone: "Avissawella" },
  { name: "Labugama",              zone: "Avissawella" },
  { name: "Yatiyanthota Junction", zone: "Avissawella" },
  { name: "Kitulgala Turn",        zone: "Avissawella" },
  { name: "Deraniyagala Road",     zone: "Avissawella" },
  { name: "Kithulgala",            zone: "Avissawella" },
  { name: "Ruwanwella",            zone: "Avissawella" },
  { name: "Mawanella Road",        zone: "Avissawella" },
  { name: "Deraniyagala",          zone: "Avissawella" },
  { name: "Avissawella Bus Stand", zone: "Avissawella" },
  { name: "Avissawella",           zone: "Avissawella" },
];

// ── Seed data ─────────────────────────────────────────────────────────────────
const initialRoutes: Route[] = [
  {
    id: "RT0001", name: "Route 138", from: "Colombo Fort", to: "Maharagama",
    stops: 12, buses: 18, avgTime: "45 min", status: "Active",
    stopList: [
      { id: "01", name: "Colombo Fort",        timeFromStart: "00.00" },
      { id: "02", name: "Slave Island",         timeFromStart: "00.05" },
      { id: "03", name: "Kollupitiya",          timeFromStart: "00.10" },
      { id: "04", name: "Bambalapitiya",        timeFromStart: "00.15" },
      { id: "05", name: "Wellawatte",           timeFromStart: "00.20" },
      { id: "06", name: "Dehiwala",             timeFromStart: "00.25" },
      { id: "07", name: "Mount Lavinia",        timeFromStart: "00.30" },
      { id: "08", name: "Ratmalana",            timeFromStart: "00.33" },
      { id: "09", name: "Piliyandala Junction", timeFromStart: "00.37" },
      { id: "10", name: "Kesbewa Road",         timeFromStart: "00.40" },
      { id: "11", name: "Boralesgamuwa",        timeFromStart: "00.43" },
      { id: "12", name: "Maharagama",           timeFromStart: "00.45" },
    ],
  },
  {
    id: "RT0002", name: "Route 120", from: "Colombo Fort", to: "Kesbewa",
    stops: 20, buses: 25, avgTime: "1 hr 10 min", status: "Active",
    stopList: [
      { id: "01", name: "Colombo Fort",         timeFromStart: "00.00" },
      { id: "02", name: "Maradana",             timeFromStart: "00.05" },
      { id: "03", name: "Borella",              timeFromStart: "00.10" },
      { id: "04", name: "Narahenpita",          timeFromStart: "00.15" },
      { id: "05", name: "Kirula",               timeFromStart: "00.18" },
      { id: "06", name: "Nugegoda",             timeFromStart: "00.23" },
      { id: "07", name: "Gangodawila",          timeFromStart: "00.28" },
      { id: "08", name: "Pitakotte",            timeFromStart: "00.32" },
      { id: "09", name: "Thalawathugoda",       timeFromStart: "00.36" },
      { id: "10", name: "Hokandara",            timeFromStart: "00.40" },
      { id: "11", name: "Athurugiriya",         timeFromStart: "00.44" },
      { id: "12", name: "Malabe",               timeFromStart: "00.48" },
      { id: "13", name: "Koswatta",             timeFromStart: "00.51" },
      { id: "14", name: "Battaramulla South",   timeFromStart: "00.54" },
      { id: "15", name: "Welikade",             timeFromStart: "00.57" },
      { id: "16", name: "Piliyandala",          timeFromStart: "01.01" },
      { id: "17", name: "Bandaragama Junction", timeFromStart: "01.04" },
      { id: "18", name: "Nagoda",               timeFromStart: "01.07" },
      { id: "19", name: "Kahathuduwa",          timeFromStart: "01.09" },
      { id: "20", name: "Kesbewa",              timeFromStart: "01.10" },
    ],
  },
  {
    id: "RT0003", name: "Route 122", from: "Colombo Fort", to: "Avissawella",
    stops: 25, buses: 30, avgTime: "1 hr 30 min", status: "Active",
    stopList: [
      { id: "01", name: "Colombo Fort",          timeFromStart: "00.00" },
      { id: "02", name: "Maradana",              timeFromStart: "00.05" },
      { id: "03", name: "Borella",               timeFromStart: "00.10" },
      { id: "04", name: "Rajagiriya",            timeFromStart: "00.15" },
      { id: "05", name: "Kotte",                 timeFromStart: "00.20" },
      { id: "06", name: "Nugegoda",              timeFromStart: "00.25" },
      { id: "07", name: "Maharagama",            timeFromStart: "00.30" },
      { id: "08", name: "Homagama",              timeFromStart: "00.38" },
      { id: "09", name: "Godagama",              timeFromStart: "00.43" },
      { id: "10", name: "Kahathuduwa",           timeFromStart: "00.48" },
      { id: "11", name: "Bandaragama",           timeFromStart: "00.53" },
      { id: "12", name: "Hanwella Junction",     timeFromStart: "00.58" },
      { id: "13", name: "Padukka",               timeFromStart: "01.03" },
      { id: "14", name: "Awissawella Road",      timeFromStart: "01.08" },
      { id: "15", name: "Ingiriya Junction",     timeFromStart: "01.12" },
      { id: "16", name: "Labugama",              timeFromStart: "01.15" },
      { id: "17", name: "Yatiyanthota Junction", timeFromStart: "01.18" },
      { id: "18", name: "Kitulgala Turn",        timeFromStart: "01.21" },
      { id: "19", name: "Deraniyagala Road",     timeFromStart: "01.23" },
      { id: "20", name: "Kithulgala",            timeFromStart: "01.25" },
      { id: "21", name: "Ruwanwella",            timeFromStart: "01.27" },
      { id: "22", name: "Mawanella Road",        timeFromStart: "01.28" },
      { id: "23", name: "Deraniyagala",          timeFromStart: "01.29" },
      { id: "24", name: "Avissawella Bus Stand", timeFromStart: "01.29" },
      { id: "25", name: "Avissawella",           timeFromStart: "01.30" },
    ],
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<RouteStatus, string> = {
  Active:      "bg-[#61de9f] text-[#00796b]",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Breakdown:   "bg-red-100 text-red-600",
};
const STATUS_OPTIONS: RouteStatus[] = ["Active", "Maintenance", "Breakdown"];

type FormData = Omit<Route, "id">;
const emptyForm = (): FormData => ({
  name: "", from: "", to: "",
  stops: 0, buses: 5, avgTime: "",
  status: "Active", stopList: [],
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function rebuildIds(stops: Stop[]): Stop[] {
  return stops.map((s, i) => ({ ...s, id: String(i + 1).padStart(2, "0") }));
}
function timeToMinutes(t: string): number {
  const [h, m] = t.split(".");
  return parseInt(h || "0") * 60 + parseInt(m || "0");
}
function minutesToReadable(total: number): string {
  if (total <= 0) return "0 min";
  const h = Math.floor(total / 60), m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

// ── StopPickerModal ───────────────────────────────────────────────────────────
// New design: From/To are selected INSIDE this popup using "Set Start" / "Set End" mode buttons.
// The left panel is always the full catalogue minus already-selected stops.
// Middle stops are added between Start and End. Drag-to-reorder works for middle stops only.

type StopPickerResult = { stopList: Stop[]; from: string; to: string };

type StopPickerProps = {
  initialSelected: Stop[];
  initialFrom: string;
  initialTo: string;
  onConfirm: (result: StopPickerResult) => void;
  onClose: () => void;
};

type PickMode = "start" | "end" | "middle";

function StopPickerModal({ initialSelected, onConfirm, onClose }: StopPickerProps) {
  const [selected, setSelected] = useState<Stop[]>(initialSelected);
  const [query,    setQuery]    = useState("");
  const [error,    setError]    = useState("");
  const [pickMode, setPickMode] = useState<PickMode>("start");

  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Left panel: catalogue minus selected
  const selectedNames = useMemo(() => new Set(selected.map((s) => s.name)), [selected]);
  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PREDEFINED_STOPS.filter(
      (p) => !selectedNames.has(p.name) && (q === "" || p.name.toLowerCase().includes(q))
    );
  }, [selectedNames, query]);
  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const s of available) {
      if (!map[s.zone]) map[s.zone] = [];
      map[s.zone].push(s.name);
    }
    return map;
  }, [available]);

  // Derived
  const startName = selected.length > 0 ? selected[0].name : "";
  const endName   = selected.length > 1 ? selected[selected.length - 1].name : "";

  // ── Left-panel click ──────────────────────────────────────────────────────
  const handlePickStop = (name: string) => {
    if (selectedNames.has(name)) return;

    if (pickMode === "start") {
      setSelected((prev) => {
        // Keep everything except the current first stop, prepend new start
        const rest = prev.length > 0 ? prev.slice(1) : [];
        return rebuildIds([{ id: "", name, timeFromStart: "00.00" }, ...rest]);
      });
      // After setting start, if no end yet stay in end mode, else go to middle
      setPickMode(selected.length < 2 ? "end" : "middle");
      setQuery("");
      return;
    }

    if (pickMode === "end") {
      setSelected((prev) => {
        // Keep everything except the current last stop, append new end
        const rest = prev.length > 1 ? prev.slice(0, prev.length - 1) : prev;
        return rebuildIds([...rest, { id: "", name, timeFromStart: "" }]);
      });
      setPickMode("middle");
      setQuery("");
      return;
    }

    // middle mode: insert before the end terminal
    setSelected((prev) => {
      if (prev.length >= 2) {
        const last   = prev[prev.length - 1];
        const before = prev.slice(0, prev.length - 1);
        return rebuildIds([...before, { id: "", name, timeFromStart: "" }, last]);
      }
      return rebuildIds([...prev, { id: "", name, timeFromStart: "" }]);
    });
    setQuery("");
  };

  const removeStop = (index: number) => {
    setSelected((prev) => rebuildIds(prev.filter((_, i) => i !== index)));
  };

  const updateTime = (index: number, value: string) => {
    setSelected((prev) => prev.map((s, i) => i === index ? { ...s, timeFromStart: value } : s));
  };

  // Drag reorder — terminals locked
  const resetDrag = () => { setDragging(null); setDragOver(null); };
  const handleDrop = (targetIndex: number) => {
    if (dragging === null || dragging === targetIndex) { resetDrag(); return; }
    const last = selected.length - 1;
    if (dragging === 0 || dragging === last || targetIndex === 0 || targetIndex === last) { resetDrag(); return; }
    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragging, 1);
      next.splice(targetIndex, 0, moved);
      return rebuildIds(next);
    });
    resetDrag();
  };

  // Confirm
  const handleConfirm = () => {
    if (selected.length < 2) { setError("Please set a Start stop and an End stop (minimum 2 stops)."); return; }
    for (let i = 0; i < selected.length; i++) {
      if (!/^\d{2}\.\d{2}$/.test(selected[i].timeFromStart)) {
        setError(`Stop ${i + 1} (${selected[i].name}): enter time in HH.MM format — e.g. 00.40`);
        return;
      }
    }
    setError("");
    onConfirm({
      stopList: selected,
      from: selected[0].name,
      to:   selected[selected.length - 1].name,
    });
  };

  const modeColors: Record<PickMode, string> = {
    start:  "text-[#1a7abf]",
    end:    "text-[#0d7a4e]",
    middle: "text-[#4CAF8A]",
  };
  const modeHint: Record<PickMode, string> = {
    start:  "← Click a stop on the left to set it as the START",
    end:    "← Click a stop on the left to set it as the END",
    middle: "← Click a stop to add it between Start and End",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-7 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-bold text-lg" onClick={onClose}>✕</button>
          <h2 className="text-xl font-bold text-[#122843] flex items-center gap-2">
            <span className="text-2xl">📍</span> Configure Route Stops
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            First set a <span className="font-bold text-[#1a7abf]">Start</span> and an{" "}
            <span className="font-bold text-[#0d7a4e]">End</span> stop, then search and add stops in between.
            Time format: <span className="font-bold text-gray-600">HH.MM</span>
          </p>
        </div>

        {/* Start / End / Middle mode selector */}
        <div className="flex-shrink-0 px-7 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-2 flex-wrap">

            {/* Set Start button */}
            <button
              onClick={() => setPickMode(pickMode === "start" ? "middle" : "start")}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                pickMode === "start"
                  ? "border-[#1a7abf] bg-[#eaf6ff] text-[#1a7abf] shadow-sm"
                  : "border-[#b3d9f7] bg-white text-[#1a7abf] hover:bg-[#eaf6ff]",
              ].join(" ")}
            >
              <span className="w-5 h-5 rounded-full bg-[#1a7abf] text-white text-[10px] font-black flex items-center justify-center">S</span>
              {startName
                ? <span className="max-w-[120px] truncate">{startName}</span>
                : <span className="opacity-50">{pickMode === "start" ? "Selecting…" : "Set Start"}</span>
              }
              {startName && <span className="text-[10px] opacity-40 font-normal">✎</span>}
            </button>

            <span className="text-gray-300 font-light text-lg flex-shrink-0">→</span>

            {/* Intermediate stops count badge */}
            {selected.length > 2 && (
              <>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg font-semibold flex-shrink-0">
                  {selected.length - 2} stop{selected.length - 2 > 1 ? "s" : ""} in between
                </span>
                <span className="text-gray-300 font-light text-lg flex-shrink-0">→</span>
              </>
            )}

            {/* Set End button */}
            <button
              onClick={() => setPickMode(pickMode === "end" ? "middle" : "end")}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                pickMode === "end"
                  ? "border-[#0d7a4e] bg-[#eafaf2] text-[#0d7a4e] shadow-sm"
                  : "border-[#a7e9cc] bg-white text-[#0d7a4e] hover:bg-[#eafaf2]",
              ].join(" ")}
            >
              <span className="w-5 h-5 rounded-full bg-[#0d7a4e] text-white text-[10px] font-black flex items-center justify-center">E</span>
              {endName
                ? <span className="max-w-[120px] truncate">{endName}</span>
                : <span className="opacity-50">{pickMode === "end" ? "Selecting…" : "Set End"}</span>
              }
              {endName && <span className="text-[10px] opacity-40 font-normal">✎</span>}
            </button>

            {/* Add middle stops button — only shows when start+end are set */}
            {startName && endName && (
              <button
                onClick={() => setPickMode("middle")}
                className={[
                  "flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition flex-shrink-0",
                  pickMode === "middle"
                    ? "border-[#4CAF8A] bg-[#eafff5] text-[#4CAF8A] shadow-sm"
                    : "border-[#c8f0df] bg-white text-[#4CAF8A] hover:bg-[#eafff5]",
                ].join(" ")}
              >
                <span className="text-base leading-none">+</span>
                Add Stops
              </button>
            )}

            {/* Hint */}
            <span className={`ml-auto text-[11px] font-semibold italic flex-shrink-0 ${modeColors[pickMode]}`}>
              {modeHint[pickMode]}
            </span>
          </div>
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* LEFT — catalogue */}
          <div className="w-60 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text" placeholder="Search stops..."
                  className="flex-1 text-sm bg-transparent outline-none text-black placeholder-gray-400"
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {query && <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>}
              </div>

              {/* Mode pill */}
              <div className={[
                "mt-2 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5",
                pickMode === "start"  ? "bg-[#eaf6ff] text-[#1a7abf]" :
                pickMode === "end"    ? "bg-[#eafaf2] text-[#0d7a4e]" :
                                        "bg-[#eafff5] text-[#4CAF8A]",
              ].join(" ")}>
                <span>{pickMode === "start" ? "👆" : pickMode === "end" ? "👇" : "➕"}</span>
                Clicking sets as{" "}
                <span className="uppercase">{pickMode === "middle" ? "middle stop" : pickMode}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-300 text-xs mt-8">
                  {query ? "No stops match." : "All stops added."}
                </p>
              ) : (
                Object.entries(grouped).map(([zone, names]) => (
                  <div key={zone} className="mb-4">
                    <p className="text-[9px] uppercase font-black text-gray-300 tracking-widest mb-1.5 px-1">{zone}</p>
                    <div className="space-y-0.5">
                      {names.map((name) => (
                        <button
                          key={name}
                          onClick={() => handlePickStop(name)}
                          className={[
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition group flex items-center justify-between border border-transparent",
                            pickMode === "start"
                              ? "text-[#1a7abf] hover:bg-[#eaf6ff] hover:border-[#b3d9f7]"
                              : pickMode === "end"
                                ? "text-[#0d7a4e] hover:bg-[#eafaf2] hover:border-[#a7e9cc]"
                                : "text-gray-700 hover:bg-[#4CAF8A]/10 hover:text-[#4CAF8A] hover:border-[#4CAF8A]/30",
                          ].join(" ")}
                        >
                          <span>{name}</span>
                          <span className={[
                            "opacity-0 group-hover:opacity-100 text-sm font-black leading-none",
                            pickMode === "start" ? "text-[#1a7abf]" :
                            pickMode === "end"   ? "text-[#0d7a4e]" : "text-[#4CAF8A]",
                          ].join(" ")}>
                            {pickMode === "start" ? "S" : pickMode === "end" ? "E" : "+"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — selected stops */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                  Route Stops
                  <span className="ml-2 bg-[#122843] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{selected.length}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Drag middle stops to reorder · Enter arrival time for each</p>
              </div>
              {selected.length > 0 && (
                <button onClick={() => { setSelected([]); setPickMode("start"); }}
                  className="text-[10px] text-red-400 hover:text-red-600 font-bold transition">
                  Clear all
                </button>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-2 flex-shrink-0 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                ⚠️ {error}
              </div>
            )}

            {selected.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-5 mb-1 flex-shrink-0">
                <div className="col-span-1" />
                <div className="col-span-6 text-[9px] uppercase font-black text-gray-300 tracking-wider">Stop Name</div>
                <div className="col-span-4 text-[9px] uppercase font-black text-gray-300 tracking-wider">Time (HH.MM)</div>
                <div className="col-span-1" />
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <span className="text-2xl">📍</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-300">No stops yet</p>
                  <p className="text-xs text-gray-200 mt-1">Click "Set Start" then "Set End" above, then add middle stops</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selected.map((stop, index) => {
                    const isStart    = index === 0;
                    const isEnd      = index === selected.length - 1 && selected.length > 1;
                    const isTerminal = isStart || isEnd;
                    const isDragging = dragging === index;
                    const isOver     = dragOver === index && dragging !== index;
                    const hasTimeErr = stop.timeFromStart !== "" && !/^\d{2}\.\d{2}$/.test(stop.timeFromStart);

                    return (
                      <div
                        key={`${stop.name}-${index}`}
                        draggable={!isTerminal}
                        onDragStart={() => !isTerminal && setDragging(index)}
                        onDragOver={(e) => { e.preventDefault(); if (!isTerminal) setDragOver(index); }}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={resetDrag}
                        className={[
                          "grid grid-cols-12 gap-2 items-center py-1.5 px-2 rounded-xl border transition select-none",
                          isTerminal ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                          isStart    ? "bg-[#eaf6ff] border-[#b3d9f7]" : "",
                          isEnd      ? "bg-[#eafaf2] border-[#a7e9cc]" : "",
                          isDragging ? "opacity-40 border-[#4CAF8A] bg-[#4CAF8A]/5" : "",
                          isOver     ? "border-[#4CAF8A] bg-[#4CAF8A]/5 scale-[1.01]" : "",
                          !isTerminal && !isDragging && !isOver ? "border-transparent hover:border-gray-200 hover:bg-gray-50" : "",
                        ].join(" ")}
                      >
                        {/* Index bubble */}
                        <div className="col-span-1 flex items-center justify-center">
                          <span className={[
                            "w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center",
                            isStart ? "bg-[#1a7abf]" : isEnd ? "bg-[#0d7a4e]" : "bg-[#122843]",
                          ].join(" ")}>{stop.id}</span>
                        </div>

                        {/* Name + badge */}
                        <div className="col-span-6 flex items-center gap-1.5 min-w-0">
                          {!isTerminal && (
                            <svg className="w-3 h-3 text-gray-300 flex-shrink-0" viewBox="0 0 8 14" fill="currentColor">
                              <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
                              <circle cx="2" cy="7"  r="1.2" /><circle cx="6" cy="7"  r="1.2" />
                              <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
                            </svg>
                          )}
                          <span className="text-sm font-semibold text-gray-700 truncate">{stop.name}</span>
                          {isStart && <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#b3d9f7] text-[#1a5a8a]">Start</span>}
                          {isEnd   && <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#a7e9cc] text-[#0d5c3a]">End</span>}
                        </div>

                        {/* Time */}
                        <div className="col-span-4">
                          <input
                            className={[
                              "w-full h-8 border rounded-lg px-2 text-sm outline-none font-mono text-center transition",
                              isStart     ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" : "",
                              isEnd       ? "focus:border-[#0d7a4e] border-[#a7e9cc]" : "",
                              !isTerminal ? "focus:border-[#4CAF8A] border-gray-200" : "",
                              hasTimeErr  ? "border-red-300 bg-red-50" : "",
                            ].join(" ")}
                            placeholder="00.00"
                            value={stop.timeFromStart}
                            onChange={(e) => updateTime(index, e.target.value)}
                            disabled={isStart}
                            maxLength={5}
                          />
                        </div>

                        {/* Remove */}
                        <div className="col-span-1 flex justify-center">
                          {!isTerminal && (
                            <button
                              onClick={() => removeStop(index)}
                              className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 font-bold text-[10px] transition"
                            >✕</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-400">
            {selected.length > 0 ? `${selected.length} stop${selected.length !== 1 ? "s" : ""}` : "No stops selected"}
          </p>
          <div className="flex gap-3">
            <button className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200 transition" onClick={onClose}>Cancel</button>
            <button className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg hover:bg-[#1a3a5c] transition" onClick={handleConfirm}>
              Confirm Stops
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminManageRoutes() {
  const [routes, setRoutes]             = useState<Route[]>(initialRoutes);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<RouteStatus | "All Status">("All Status");

  const [showModal, setShowModal]           = useState(false);
  const [editingRoute, setEditingRoute]     = useState<Route | null>(null);
  const [form, setForm]                     = useState<FormData>(emptyForm());
  const [formError, setFormError]           = useState("");
  const [showStopPicker, setShowStopPicker] = useState(false);
  const [viewRoute, setViewRoute]           = useState<Route | null>(null);

  const totalRoutes       = routes.length;
  const activeRoutes      = routes.filter((r) => r.status === "Active").length;
  const maintenanceRoutes = routes.filter((r) => r.status === "Maintenance").length;
  const breakdownRoutes   = routes.filter((r) => r.status === "Breakdown").length;

  const filtered = routes.filter((r) => {
    const q = search.toLowerCase();
    const match = r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) ||
      r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q);
    return match && (statusFilter === "All Status" || r.status === statusFilter);
  });

  const handleStopsConfirmed = ({ stopList, from, to }: StopPickerResult) => {
    const maxMins = Math.max(...stopList.map((s) => timeToMinutes(s.timeFromStart)));
    setForm((prev) => ({ ...prev, stopList, from, to, stops: stopList.length, avgTime: minutesToReadable(maxMins) }));
    setShowStopPicker(false);
  };

  const handleSave = () => {
    if (!form.name.trim())                              { setFormError("Route Name is required."); return; }
    if (!/^Route\s+\d+$/i.test(form.name.trim()))      { setFormError("Route Name must be in the format 'Route 138'."); return; }
    if (!Number.isInteger(form.buses) || form.buses < 0){ setFormError("No. of Buses must be 0 or a positive whole number."); return; }
    if (form.stopList.length < 2)                       { setFormError("Please configure stops using the 'Configure Stops' button."); return; }

    if (editingRoute) {
      setRoutes((prev) => prev.map((r) => r.id === editingRoute.id ? { ...form, id: editingRoute.id } : r));
    } else {
      const lastNum = routes.reduce((max, r) => Math.max(max, parseInt(r.id.replace("RT", ""))), 0);
      setRoutes((prev) => [...prev, { ...form, id: `RT${String(lastNum + 1).padStart(4, "0")}` }]);
    }
    setShowModal(false);
    setFormError("");
    Swal.fire({ icon: "success", title: "Saved Successfully", timer: 1500, showConfirmButton: false });
  };

  const handleDelete = async (route: Route) => {
    const result = await Swal.fire({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px 0">
               <img src="/icons/delete.png" style="width:30px;height:30px;margin-bottom:5px" alt="delete"/>
               <p style="color:#374151;font-size:13px;font-weight:700;margin:0">Remove ${route.id}?</p>
               <p style="color:#9ca3af;font-size:11px;margin:0">${route.name} · Permanent Deletion</p>
             </div>`,
      showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Remove Route",
    });
    if (result.isConfirmed) setRoutes((prev) => prev.filter((r) => r.id !== route.id));
  };

  return (
    <div className="p-6">

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { img: "route",       val: totalRoutes,       label: "Total Routes",      color: "text-black"      },
          { img: "success",     val: activeRoutes,      label: "Active Routes",     color: "text-[#00796b]"  },
          { img: "maintenance", val: maintenanceRoutes, label: "Under Maintenance", color: "text-yellow-500" },
          { img: "break",       val: breakdownRoutes,   label: "Breakdowns",        color: "text-red-500"    },
        ].map(({ img, val, label, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
            <img src={`/icons/${img}.png`} className="w-12 h-12 object-contain" alt="" />
            <div><p className={`text-3xl font-extrabold ${color}`}>{val}</p><p className="text-[#94a0ae] text-sm">{label}</p></div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[#828282]/40 rounded-lg px-3 py-2 w-80 shadow-sm">
          <img src="/icons/lens.png" className="w-5 h-5 opacity-50" alt="" />
          <input type="text" placeholder="Search route ID, name or destination..."
            className="flex-1 text-sm bg-transparent outline-none text-black"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 border border-[#828282]/40 rounded-lg px-3 bg-white text-sm text-black cursor-pointer shadow-sm"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="All Status">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => { setEditingRoute(null); setForm(emptyForm()); setFormError(""); setShowModal(true); }}
          className="ml-auto h-10 bg-[#4CAF8A] text-white font-semibold px-6 rounded-lg hover:bg-[#3d9e7a] transition shadow-md"
        >+ Add Route</button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-9 bg-[#f5f8fc] px-4 py-3 text-sm font-extrabold text-gray-700 border-b uppercase tracking-wider">
          <div>Route ID</div><div>Route Name</div><div className="col-span-2">From → To</div>
          <div>Stops</div><div>Buses</div><div>Avg Time</div><div>Status</div>
          <div className="text-center">Action</div>
        </div>
        {filtered.length > 0 ? filtered.map((route) => (
          <div key={route.id} className="grid grid-cols-9 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition">
            <div className="font-semibold text-[#122843]">{route.id}</div>
            <div className="font-medium text-gray-700">{route.name}</div>
            <div className="col-span-2 text-xs">
              <span className="font-semibold text-gray-700">{route.from}</span>
              <span className="mx-1 text-gray-400">→</span>
              <span className="font-semibold text-gray-700">{route.to}</span>
            </div>
            <div className="text-gray-600">{route.stops}</div>
            <div className="text-gray-600">{route.buses}</div>
            <div className="text-gray-600 text-xs">{route.avgTime}</div>
            <div><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${STATUS_STYLES[route.status]}`}>{route.status}</span></div>
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setViewRoute(route)} className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shadow-sm transition">
                <img src="/icons/view.png" className="w-6 h-6" alt="view" />
              </button>
              <button onClick={() => { setEditingRoute(route); setForm({ ...route }); setFormError(""); setShowModal(true); }}
                className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 shadow-sm transition">
                <img src="/icons/edit.png" className="w-5 h-5" alt="edit" />
              </button>
              <button onClick={() => handleDelete(route)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 shadow-sm transition">
                <img src="/icons/delete.png" className="w-4 h-4" alt="delete" />
              </button>
            </div>
          </div>
        )) : (
          <div className="p-20 text-center text-gray-400"><p className="text-sm font-medium">No routes found.</p></div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg mx-4 relative">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-bold" onClick={() => setShowModal(false)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-5 flex items-center gap-3">
              <img src="/icons/route.png" className="w-10 h-10 object-contain" alt="" />
              {editingRoute ? `Update ${editingRoute.id}` : "New Route Registration"}
            </h2>

            {formError && (
              <div className="mb-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">⚠️ {formError}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Route Name</label>
                <input className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  placeholder="e.g. Route 138" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">No. of Buses</label>
                <input type="number" min={0} step={1}
                  className="w-full h-10 border rounded-lg px-3 text-sm outline-none focus:border-[#4CAF8A]"
                  value={form.buses} onChange={(e) => setForm({ ...form, buses: Math.floor(Number(e.target.value)) })} />
              </div>

              {/* From — read-only display, set inside the stop picker */}
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                  From <span className="text-[#4CAF8A] normal-case font-semibold">(set in stops)</span>
                </label>
                <div className={[
                  "w-full h-10 border border-dashed rounded-lg px-3 text-sm flex items-center bg-gray-50",
                  form.from ? "border-[#b3d9f7] text-[#1a7abf] font-semibold" : "border-gray-300 text-gray-400",
                ].join(" ")}>
                  {form.from || "—"}
                </div>
              </div>

              {/* To — read-only display, set inside the stop picker */}
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                  To <span className="text-[#4CAF8A] normal-case font-semibold">(set in stops)</span>
                </label>
                <div className={[
                  "w-full h-10 border border-dashed rounded-lg px-3 text-sm flex items-center bg-gray-50",
                  form.to ? "border-[#a7e9cc] text-[#0d7a4e] font-semibold" : "border-gray-300 text-gray-400",
                ].join(" ")}>
                  {form.to || "—"}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                  No. of Stops <span className="text-[#4CAF8A] normal-case font-semibold">(auto-calculated)</span>
                </label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {form.stops > 0 ? `${form.stops} stops` : "—"}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">
                  Avg Travel Time <span className="text-[#4CAF8A] normal-case font-semibold">(auto-calculated)</span>
                </label>
                <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg px-3 text-sm flex items-center text-gray-500 bg-gray-50">
                  {form.avgTime || "—"}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Status</label>
                <select className="w-full h-10 border rounded-lg px-3 text-sm"
                  value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RouteStatus })}>
                  {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowStopPicker(true)}
              className="mt-4 w-full h-11 border-2 border-dashed border-[#4CAF8A] rounded-xl text-[#4CAF8A] font-bold text-sm hover:bg-[#4CAF8A]/5 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">📍</span>
              {form.stopList.length > 0 ? `Edit Stops  ·  ${form.stopList.length} stops configured` : "Configure Stops"}
            </button>

            <div className="mt-5 flex justify-end gap-3">
              <button className="px-5 py-2 rounded-lg bg-gray-100 font-bold text-gray-600 text-sm hover:bg-gray-200" onClick={() => setShowModal(false)}>Discard</button>
              <button className="px-8 py-2 rounded-lg bg-[#122843] text-white font-bold text-sm shadow-lg" onClick={handleSave}>Save Route</button>
            </div>
          </div>
        </div>
      )}

      {/* STOP PICKER MODAL */}
      {showStopPicker && (
        <StopPickerModal
          initialSelected={form.stopList}
          initialFrom={form.from}
          initialTo={form.to}
          onConfirm={handleStopsConfirmed}
          onClose={() => setShowStopPicker(false)}
        />
      )}

      {/* VIEW MODAL */}
      {viewRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl p-7 relative">
            <button className="absolute right-4 top-4 text-gray-400 hover:text-red-500 font-black" onClick={() => setViewRoute(null)}>✕</button>
            <h2 className="text-xl font-bold text-[#122843] mb-6 flex items-center gap-3">
              <img src="/icons/route.png" className="w-10 h-10 object-contain" alt="" />
              Route Info: {viewRoute.id}
            </h2>
            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Route ID</p><p className="font-bold text-gray-800">{viewRoute.id}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Route Name</p><p className="font-bold text-gray-800">{viewRoute.name}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Avg Travel Time</p><p className="font-bold text-gray-800">{viewRoute.avgTime}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">From</p><p className="font-bold text-gray-800">{viewRoute.from}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">To</p><p className="font-bold text-gray-800">{viewRoute.to}</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Total Stops</p><p className="font-bold text-gray-800">{viewRoute.stops} Stops</p></div>
              <div><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Assigned Buses</p><p className="font-bold text-gray-800">{viewRoute.buses} Buses</p></div>
              {viewRoute.stopList?.length > 0 && (
                <div className="col-span-2 pt-4 border-t border-gray-200">
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Stop Details</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {viewRoute.stopList.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-[#122843] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{s.id}</span>
                        <span className="flex-1 text-gray-700 font-medium">{s.name}</span>
                        <span className="text-gray-400 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.timeFromStart}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="col-span-2 pt-4 border-t border-gray-200">
                <p className="text-[10px] uppercase font-black text-gray-400 mb-2">Route Status</p>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${STATUS_STYLES[viewRoute.status]}`}>{viewRoute.status}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewRoute(null)} className="px-10 py-2.5 bg-[#122843] text-white rounded-xl text-sm font-bold shadow-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
