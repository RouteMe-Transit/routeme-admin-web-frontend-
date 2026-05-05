"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { AiFillEdit } from "react-icons/ai";

type StopsMapPickerProps = {
    formData: {
        name: string;
        longitude: string;
        latitude: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        name: string;
        longitude: string;
        latitude: string;
    }>>;
};

const StopsMapPicker = dynamic<StopsMapPickerProps>(
    () => import("@/app/admin/manageStops/StopsMapPicker"),
    {
        ssr: false,
        loading: () => (
            <div className="h-75 rounded bg-slate-100 flex items-center justify-center text-sm text-slate-500">
                Loading map...
            </div>
        ),
    });

type Stop = {
    id: number;
    name: string;
    longitude: string;
    latitude: string;
    isActive: boolean;
};

export default function AdminManageStopsPage() {
    const [useMap, setUseMap] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        longitude: "",
        latitude: "",
    });
    const [search, setSearch] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [stops, setStops] = useState<Stop[]>([
        {
            id: 1,
            name: "Colombo Fort",
            longitude: "79.8500",
            latitude: "6.9344",
            isActive: true,
        },
        {
            id: 2,
            name: "Pettah",
            longitude: "79.8588",
            latitude: "6.9395",
            isActive: true,
        },
        {
            id: 3,
            name: "Kottawa",
            longitude: "79.9580",
            latitude: "6.8410",
            isActive: true,
        },
        {
            id: 4,
            name: "Maharagama",
            longitude: "79.9265",
            latitude: "6.8480",
            isActive: true,
        },
    ]);

    // handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId !== null) {
            const editedStop = stops.find((stop) => stop.id === editId);
            // EDIT
            setStops(
                stops.map((stop) =>
                    stop.id === editId ? { ...stop, ...formData } : stop
                )
            );
            toast.success(`${editedStop?.name ?? "Stop"} updated successfully`);
            setEditId(null);
        } else {
            // ADD
            const newStop: Stop = {
                id: Date.now(),
                name: formData.name,
                longitude: formData.longitude,
                latitude: formData.latitude,
                isActive: true,
            };
            setStops([...stops, newStop]);
            toast.success(`${newStop.name} added successfully`);
        }

        setFormData({ name: "", longitude: "", latitude: "" });
        setShowForm(false);
    };
    const handleEdit = (stop: Stop) => {
        setFormData({
            name: stop.name,
            longitude: stop.longitude,
            latitude: stop.latitude,
        });
        setEditId(stop.id);
        setShowForm(true);
    };
    const handleToggleActive = async (id: number) => {
        const stopToUpdate = stops.find((stop) => stop.id === id);
        if (!stopToUpdate) {
            return;
        }

        const nextActiveState = !stopToUpdate.isActive;

        const result = await Swal.fire({
            title: `${nextActiveState ? "Activate" : "Deactivate"} this stop?`,
            text: `${stopToUpdate.name} will be marked as ${nextActiveState ? "active" : "deactive"}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: nextActiveState ? "#16a34a" : "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Yes, ${nextActiveState ? "activate" : "deactivate"}`,
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) {
            return;
        }

        setStops(
            stops.map((stop) =>
                stop.id === id ? { ...stop, isActive: nextActiveState } : stop
            )
        );
        toast.success(`${stopToUpdate.name} ${nextActiveState ? "activated" : "deactivated"} successfully`);
    };
    const filteredStops = stops.filter((stop) =>
        stop.name.toLowerCase().includes(search.toLowerCase())
    );


    return (
        <section className="p-6 space-y-6">
            <div className=" justify-between items-center flex">
                <button className="border w-30 h-10 rounded-md bg-[#4CAF8A] text-white font-bold hover:bg-[#3d9e7a]" onClick={() => setShowForm(true)}>
                    Add Stops
                </button>
                <label className="border w-30 h-10 rounded-md bg-[#122843] text-white font-bold flex items-center justify-center">
                    Total: {stops.length}
                </label>

            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white rounded-lg shadow-lg w-125 p-6 space-y-4">

                        <h2 className="text-lg font-semibold">
                            {editId ? "Edit Stop" : "Add New Stop"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">

                            {/* STOP NAME */}
                            <input
                                type="text"
                                name="name"
                                placeholder="Stop Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                                required
                            />

                            {/* TOGGLE */}
                            <div className="flex gap-4 text-sm">
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        checked={!useMap}
                                        onChange={() => setUseMap(false)}
                                    />
                                    Enter Manually
                                </label>

                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        checked={useMap}
                                        onChange={() => setUseMap(true)}
                                    />
                                    Pick from Map
                                </label>
                            </div>

                            {/* MAP MODE */}
                            {useMap && (
                                <StopsMapPicker formData={formData} setFormData={setFormData} />
                            )}

                            {/* LAT/LNG INPUTS */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="latitude"
                                    placeholder="Latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    readOnly={useMap}
                                    className={`w-full border p-2 rounded ${useMap ? "bg-gray-100" : ""
                                        }`}
                                    required
                                />

                                <input
                                    type="text"
                                    name="longitude"
                                    placeholder="Longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    readOnly={useMap}
                                    className={`w-full border p-2 rounded ${useMap ? "bg-gray-100" : ""
                                        }`}
                                    required
                                />
                            </div>

                            {useMap && (
                                <p className="text-sm text-gray-500">
                                    Click on the map to select location
                                </p>
                            )}

                            {/* BUTTONS */}
                            <div className="flex justify-end gap-2 pt-2">

                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 bg-gray-400 text-white rounded"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Save
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="w-full md:w-1/3">
                <input
                    type="text"
                    placeholder="Search stops..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-slate-300 bg-white p-2 rounded-md"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="grid grid-cols-7 bg-[#f5f8fc] px-4 py-3 text-xs font-extrabold text-gray-600 border-b uppercase tracking-wide">
                    <div>Stop ID</div>
                    <div>Stop Name</div>
                    <div>Longitude</div>
                    <div>Latitude</div>
                    <div>Status</div>
                    <div>Map</div>
                    <div className="text-center">Action</div>
                </div>

                {filteredStops.length > 0 ? (
                    filteredStops.map((stop, index) => {
                        const stopCode = `S${String(index + 1).padStart(2, "0")}`;

                        return (
                            <div
                                key={stop.id}
                                className="grid grid-cols-7 items-center px-4 py-3 text-sm text-black border-b hover:bg-gray-50 transition"
                            >
                                <div className="font-semibold">
                                    <span className="bg-[#122843] text-white px-2 py-1 rounded text-sm">
                                        {stopCode}
                                    </span>
                                </div>

                                <div className="font-medium text-gray-600">{stop.name}</div>
                                <div>{stop.longitude}</div>
                                <div>{stop.latitude}</div>

                                <div>
                                    <span
                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${stop.isActive
                                            ? "bg-[#61de9f] text-[#00796b]"
                                            : "bg-red-100 text-red-600"
                                        }`}
                                    >
                                        {stop.isActive ? "Active" : "Deactive"}
                                    </span>
                                </div>

                                <div>
                                    <a
                                        href={`https://www.google.com/maps?q=${stop.latitude},${stop.longitude}`}
                                        target="_blank"
                                        className="font-semibold text-[#1d9e75] hover:underline"
                                    >
                                        View
                                    </a>
                                </div>

                                <div className="flex items-center justify-center gap-1.5">
                                    <button
                                        onClick={() => handleEdit(stop)}
                                        className="w-8 h-8 rounded-full  flex items-center justify-center "
                                    >
                                        <AiFillEdit size={18} color="blue" />
                                    </button>

                                    <button
                                        onClick={() => handleToggleActive(stop.id)}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors ${stop.isActive ? "bg-[#61de9f] border-[#61de9f]" : "bg-slate-200 border-slate-300"
                                            }`}
                                        title={stop.isActive ? "Deactivate stop" : "Activate stop"}
                                        aria-label={stop.isActive ? "Deactivate stop" : "Activate stop"}
                                    >
                                        <span
                                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${stop.isActive ? "translate-x-7" : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 text-gray-400 text-sm">No stops added yet</div>
                )}
            </div>
        </section>
    );
}