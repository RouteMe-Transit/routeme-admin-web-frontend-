"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { CgClose } from "react-icons/cg";
import { IoMdAdd } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoEye } from "react-icons/io5";

type FavoriteRoute = {
    id: number;
    code: string;
    name: string;
};

type FeedbackItem = {
    id: number;
    message: string;
    date: string;
};


export default function PassengerProfilePage() {
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
    const [view, setView] = useState<"profile" | "favorites" | "addRoute" | "feedback" | "editProfile" | "changePassword">("profile");

    const [user, setUser] = useState<{
        firstName: string;
        lastName: string;
        image: string;
        favoriteRoutes: FavoriteRoute[];
        feedback: FeedbackItem[];
    }>({
        firstName: "Kavindra",
        lastName: "Senarathne",
        image: "/default-profile-image.svg",
        favoriteRoutes: [
            { id: 1, code: "138", name: "Homagama - Pettah" },
            { id: 2, code: "122", name: "Moratuwa - Pettah" }
        ],
        feedback: [
            {
                id: 1,
                category: "Delay",
                busNumber: "138",
                rating: 2,
                message: "The bus was late today.",
                date: "2026-04-07",
            },
            {
                id: 2,
                category: "Service",
                busNumber: "138",
                rating: 5,
                message: "Great service on Route 138!hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
                date: "2026-04-05",
            }
        ]
    });
    const [search, setSearch] = useState("");

    const allRoutes: FavoriteRoute[] = [
        { id: 1, code: "138", name: "Route 138" },
        { id: 2, code: "122", name: "Route 122" },
        { id: 3, code: "100", name: "Route 100" },
        { id: 4, code: "245", name: "Route 245" },
        { id: 5, code: "300", name: "Route 300" },
        { id: 6, code: "450", name: "Route 450" },
        { id: 7, code: "500", name: "Route 500" },
        { id: 8, code: "600", name: "Route 600" },
        { id: 9, code: "700", name: "Route 700" },
        { id: 10, code: "800", name: "Route 800" },
        { id: 11, code: "900", name: "Route 900" },
        { id: 12, code: "1000", name: "Route 1000" }
    ];
    const filteredRoutes = allRoutes.filter(route => route.name.toLowerCase().includes(search.toLowerCase())
    );

    const addRouteToFavorites = (route: FavoriteRoute) => {
        const exists = user.favoriteRoutes.some((r) => r.id === route.id);
        if (exists) {
            toast.error("Route is already in favorites.", { id: "fav-route-exists" });
            return;
        }

        setUser((prev) => ({
            ...prev,
            favoriteRoutes: [...prev.favoriteRoutes, route],
        }));
        toast.success("Route added to favorites.", { id: "fav-route-added" });
        setView("favorites");
    };
    const removeRoute = (id: number) => {
        setUser(prev => ({
            ...prev,
            favoriteRoutes: prev.favoriteRoutes.filter(r => r.id !== id),
        }));
        toast.success("Route removed from favorites.", { id: "fav-route-removed" });
    };
    const [editData, setEditData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: "",
        phone: "",
        image: user.image,
    });



    const handleUpdateProfile = () => {
        setUser(prev => ({
            ...prev,
            firstName: editData.firstName,
            lastName: editData.lastName,
            image: editData.image,
        }));

        toast.success("Profile updated successfully ✅");
        setView("profile");
    };

    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
        oldPassword: "",
    });
    const handleChangePassword = () => {
        if (!passwordData.newPassword || !passwordData.confirmPassword || !passwordData.oldPassword) {
            toast.error("Please fill all fields");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        // simulate success (later replace with API)
        toast.success("Password changed successfully 🔐");

        setPasswordData({ newPassword: "", confirmPassword: "", oldPassword: "" });
        setView("profile");
    };
    type FeedbackItem = {
        id: number;
        category: string;
        busNumber: string;
        rating: number;
        message: string;
        date: string;
    };



    return (
        <section className="">
            <div className="bg-[#1228430F] w-full h-72.5 border-b border-gray-300 shadow-sm flex justify-center flex-col items-center">
                <img src={user.image} alt="Profile" className="w-30 h-30 rounded-full border border-gray-300 mt-10" />
                <h1 className="text-xl font-bold text-gray-800 ml-4 mt-5">{user.firstName} {user.lastName}</h1>
                <h3>Passenger</h3>

            </div>

            <div className="flex gap-4 mt-6 justify-center">
                <button className="w-27.5 h-14.25 bg-white rounded-md text-[#4CAF8A] font-bold text-md hover:bg-gray-200 " onClick={() => setView("favorites")}>
                    FavRoutes
                </button>
                <button className="w-27.5 h-14.25 bg-white rounded-md  font-bold text-md hover:bg-gray-200" onClick={() => setView("feedback")}>
                    Feedbacks
                </button>
            </div>

            <div className="flex flex-col items-center mt-10 ">
                <button className="w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 rounded-t-md border-b border-gray-300 hover:bg-gray-200"
                    onClick={() => setView("editProfile")}>
                    <img src="/icons/user1.svg" alt="Edit" className="inline-block w-8 h-8 mr-5" />
                    Edit Profile
                </button>
                <button className="w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 border-b border-gray-300 hover:bg-gray-200"
                    onClick={() => setView("changePassword")}
                >
                    <img src="/icons/lock.svg" alt="Change Password" className="inline-block w-8 h-8 mr-5" />
                    Change Password
                </button>
                <button className="w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 border-b border-gray-300 hover:bg-gray-200">
                    <img src="/icons/globe.svg" alt="Language" className="inline-block w-8 h-8 mr-5" />
                    Language
                </button>
                <button className="w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 rounded-b-md hover:bg-gray-200">
                    <img src="/icons/moon.svg" alt="Dark Mode" className="inline-block w-8 h-8 mr-5" />
                    Dark Mode
                </button>

            </div>

            {view === "favorites" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="h-150 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Favorite Routes</h2>
                            <button className="rounded bg-red-500 hover:bg-red-600 p-1"

                                onClick={() => setView("profile")}
                            >
                                <CgClose size={15} color="white" />
                            </button>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button className="rounded bg-green-600 hover:bg-green-700 p-1"
                                onClick={() => setView("addRoute")}
                            >
                                <IoMdAdd size={16} color="white" />
                            </button>
                        </div>

                        <ul className="space-y-2 mt-5">
                            {user.favoriteRoutes.map((route) => (
                                <li key={route.id} className="rounded-md bg-gray-100 p-4 shadow-sm h-10 flex items-center">
                                    <img src="/icons/road.svg" alt="Bus Icon" className="w-5 h-5 mr-3" />
                                    {route.code} -
                                    {" " + route.name}
                                    <button className="ml-auto rounded p-1 hover:bg-red-100"
                                        onClick={() => removeRoute(route.id)}
                                    >
                                        <MdDelete size={22} color="red" />
                                    </button>

                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {view === "addRoute" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl flex flex-col max-h-150">


                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Add Favorite Routes</h2>
                            <button
                                className="rounded bg-red-500 hover:bg-red-600 p-1"
                                onClick={() => setView("profile")}
                            >
                                <CgClose size={15} color="white" />
                            </button>
                        </div>


                        <input
                            type="text"
                            placeholder="Search routes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded border px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />


                        <div className="flex-1 overflow-y-auto space-y-2">
                            {filteredRoutes.length === 0 ? (
                                <p className="text-sm text-gray-500">No routes found</p>
                            ) : (
                                filteredRoutes.map(route => (
                                    <div
                                        key={route.id}
                                        className="cursor-pointer rounded border px-3 py-2 hover:bg-blue-50 flex justify-between items-center"
                                    >
                                        <span>{route.name}</span>
                                        <button className="rounded bg-green-600 hover:bg-green-700 p-1"
                                            onClick={() => addRouteToFavorites(route)}

                                        >
                                            <IoMdAdd size={16} color="white" />

                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            )}
            {view === "feedback" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="h-150 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

                        {/* Header */}
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">My Feedback</h2>
                            <button
                                className="rounded bg-red-500 hover:bg-red-600 p-1"
                                onClick={() => setView("profile")}
                            >
                                <CgClose size={15} color="white" />
                            </button>
                        </div>

                        {/* Feedback List */}
                        <ul className="space-y-3 mt-5">
                            {user.feedback.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center">
                                    No feedback submitted yet
                                </p>
                            ) : (
                                user.feedback.map((item) => (
                                    <li
                                        key={item.id}
                                        className="rounded-md bg-gray-100 p-4 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start">

                                            <div className="max-w-[220px]">
                                                {/* Category */}
                                                <p className="text-sm font-semibold text-[#122843]">
                                                    {item.category}
                                                </p>

                                                {/* Bus Number */}
                                                <p className="text-xs text-gray-600">
                                                    Bus: {item.busNumber}
                                                </p>



                                                {/* Short message */}
                                                <p className="text-gray-800 text-sm mt-1 truncate">
                                                    {item.message}
                                                </p>

                                                <p className="text-xs text-gray-500 mt-2">
                                                    {item.date}
                                                </p>
                                            </div>

                                            {/* View Button */}
                                            <button
                                                className="text-blue-600 text-sm underline"
                                                onClick={() => setSelectedFeedback(item)}
                                            >
                                                <IoEye size={25} />
                                            </button>

                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>

                    </div>
                </div>
            )}

            {selectedFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">

                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">Feedback Details</h2>
                            <button
                                className="bg-red-500 hover:bg-red-600 p-1 rounded"
                                onClick={() => setSelectedFeedback(null)}
                            >
                                <CgClose size={16} color="white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-2 text-sm">

                            <p>
                                <span className="font-semibold">Category:</span>{" "}
                                {selectedFeedback.category}
                            </p>

                            <p>
                                <span className="font-semibold">Bus Number:</span>{" "}
                                {selectedFeedback.busNumber}
                            </p>

                            <p>
                                <span className="font-semibold">Rating:</span>{" "}
                                <span className="text-yellow-400">
                                    {"★".repeat(selectedFeedback.rating)}
                                </span>
                            </p>

                            <p>
                                <span className="font-semibold">Message:</span>
                            </p>
                            <p className="bg-gray-100 p-3 rounded break-words whitespace-pre-wrap">
                                {selectedFeedback.message}
                            </p>

                            <p className="text-xs text-gray-500">
                                {selectedFeedback.date}
                            </p>

                        </div>
                    </div>
                </div>
            )}

            {view === "editProfile" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl ">

                        {/* Header */}
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Edit Profile</h2>
                            <button
                                className="bg-red-500 hover:bg-red-600 p-1 rounded"
                                onClick={() => setView("profile")}
                            >
                                <CgClose size={16} color="white" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-3  justify-center flex flex-col ">
                            <input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const imageUrl = URL.createObjectURL(file);
                                        setEditData({ ...editData, image: imageUrl });
                                    }
                                }}
                            />

                            <img src={editData.image} className="w-20 h-20 rounded-full ml-40 border " />

                            {/* Name */}
                            <div className="flex gap-3">
                                <label className="text-sm font-medium text-gray-700">First Name:</label>
                                <input
                                    type="text"
                                    value={editData.firstName}
                                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                                    placeholder="First Name"
                                    className="w-[300px]  px-3 py-2 rounded bg-[#1228430F]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <label className="text-sm font-medium text-gray-700">Last Name:</label>

                                <input
                                    type="text"
                                    value={editData.lastName}
                                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                                    placeholder="Last Name"
                                    className="w-[301px] px-3 py-2 rounded bg-[#1228430F]"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex gap-11">
                                <label className="text-sm font-medium text-gray-700">Email:</label>
                                <input
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    placeholder="Email"
                                    className="w-[300px] px-3 py-2 rounded bg-[#1228430F]"
                                />
                            </div>


                            {/* Phone */}
                            <div className="flex gap-3">
                                <label className="text-sm font-medium text-gray-700">Phone Number:</label>
                                <input
                                    type="text"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    placeholder="Phone Number"
                                    className="w-[268px] px-3 py-2 rounded bg-[#1228430F]"
                                />
                            </div>




                            {/* Button */}
                            <button
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
                                onClick={handleUpdateProfile}
                            >
                                Update Profile

                            </button>

                        </div>
                    </div>
                </div>
            )}
            {view === "changePassword" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

                        {/* Header */}
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Change Password</h2>
                            <button
                                className="bg-red-500 hover:bg-red-600 p-1 rounded"
                                onClick={() => setView("profile")}
                            >
                                <CgClose size={16} color="white" />
                            </button>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder="Old Password"
                                value={passwordData.oldPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                                }
                                className="w-full border px-3 py-2 rounded"
                            />

                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                                }
                                className="w-full border px-3 py-2 rounded"
                            />

                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                }
                                className="w-full border px-3 py-2 rounded"
                            />

                            {/* Button */}
                            <button
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
                                onClick={handleChangePassword}
                            >
                                Update Password
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}

