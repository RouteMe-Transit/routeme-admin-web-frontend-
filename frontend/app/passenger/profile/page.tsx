"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { CgClose } from "react-icons/cg";
import { IoMdAdd } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { IoEye } from "react-icons/io5";
import { usePassengerTheme } from "../PassengerThemeContext";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileActionList, { type ProfileActionItem } from "../../components/profile/ProfileActionList";
import api from "../../services/api";

type FavoriteRoute = {
    id: number;
    routeName: string;
    from?: string;
    to?: string;
    addedAt?: string;
};

type FeedbackItem = {
    id: number;
    category: string;
    busNumber: string;
    rating: number;
    message: string;
    date: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
            | { message?: string; error?: string; errors?: Array<{ message?: string; msg?: string }> }
            | undefined;
        return (
            responseData?.message ??
            responseData?.error ??
            responseData?.errors?.[0]?.message ??
            responseData?.errors?.[0]?.msg ??
            fallback
        );
    }
    if (error instanceof Error) return error.message;
    return fallback;
};

const formatRouteSubtitle = (route: FavoriteRoute) => {
    if (route.from && route.to) return `${route.from} → ${route.to}`;
    return route.routeName;
};

// ── Static seed data ──────────────────────────────────────────────────────────

const initialUser = {
    firstName: "Kavindra",
    lastName: "Senarathne",
    image: "/default-profile-image.svg",
};

const initialFeedback: FeedbackItem[] = [
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
    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PassengerProfilePage() {
    const router = useRouter();
    const { isDarkMode, toggleTheme } = usePassengerTheme();
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
    const [view, setView] = useState<"profile" | "favorites" | "addRoute" | "feedback" | "editProfile" | "changePassword">("profile");
    const [user, setUser] = useState(initialUser);

    // favourite routes state
    const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>([]);
    const [favoriteSearch, setFavoriteSearch] = useState("");
    const [favoriteRoutesLoading, setFavoriteRoutesLoading] = useState(false);
    const [favoriteRoutesError, setFavoriteRoutesError] = useState("");

    // add-route search state
    const [routeSearch, setRouteSearch] = useState("");
    const [routeResults, setRouteResults] = useState<FavoriteRoute[]>([]);
    const [routeResultsLoading, setRouteResultsLoading] = useState(false);
    const [routeResultsError, setRouteResultsError] = useState("");

    const [editData, setEditData] = useState({
        firstName: initialUser.firstName,
        lastName: initialUser.lastName,
        email: "",
        phone: "",
        image: initialUser.image,
    });
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
        oldPassword: "",
    });

    // ── API calls ─────────────────────────────────────────────────────────────

    const loadFavoriteRoutes = useCallback(async () => {
        try {
            setFavoriteRoutesLoading(true);
            setFavoriteRoutesError("");

            const params = favoriteSearch.trim() ? { search: favoriteSearch.trim() } : undefined;
            const response = await api.get("/users/me/favorite-routes", { params });

            // shape: { success, data: { total, routes: [{ id, routeName, from, to }] } }
            const routes: FavoriteRoute[] = response.data?.data?.routes ?? [];
            setFavoriteRoutes(routes);
        } catch (error) {
            const message = getErrorMessage(error, "Failed to load favorite routes.");
            setFavoriteRoutesError(message);
            toast.error(message);
        } finally {
            setFavoriteRoutesLoading(false);
        }
    }, [favoriteSearch]);

    const loadRouteResults = useCallback(async () => {
        try {
            setRouteResultsLoading(true);
            setRouteResultsError("");

            const search = routeSearch.trim();
            const response = await api.get("/routes", {
                params: search ? { search } : undefined,
            });

            const raw = response.data?.data ?? response.data ?? [];
            const list: FavoriteRoute[] = (Array.isArray(raw) ? raw : raw.routes ?? []).map(
                (r: { id?: unknown; routeName?: unknown; from?: unknown; to?: unknown }) => ({
                    id: Number(r.id),
                    routeName: String(r.routeName ?? ""),
                    from: r.from ? String(r.from) : undefined,
                    to: r.to ? String(r.to) : undefined,
                })
            );

            setRouteResults(list);
        } catch (error) {
            const message = getErrorMessage(error, "Failed to search routes.");
            setRouteResultsError(message);
            toast.error(message);
        } finally {
            setRouteResultsLoading(false);
        }
    }, [routeSearch]);

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        setEditData((prev) => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
        }));
    }, [user.firstName, user.lastName, user.image]);

    useEffect(() => {
        if (view !== "favorites") return;
        const id = window.setTimeout(() => { void loadFavoriteRoutes(); }, 250);
        return () => window.clearTimeout(id);
    }, [view, loadFavoriteRoutes]);

    useEffect(() => {
        if (view !== "addRoute") return;
        const id = window.setTimeout(() => { void loadRouteResults(); }, 250);
        return () => window.clearTimeout(id);
    }, [view, loadRouteResults]);

    // ── Favourite actions ─────────────────────────────────────────────────────

    const addRouteToFavorites = async (route: FavoriteRoute) => {
        try {
            const alreadySaved = favoriteRoutes.some((r) => r.id === route.id);
            if (alreadySaved) {
                toast.error("Route is already in favorites.", { id: "fav-route-exists" });
                return;
            }

            // POST /users/me/favorite-routes  { routeId }
            await api.post("/users/me/favorite-routes", { routeId: route.id });

            toast.success("Route added to favorites.", { id: "fav-route-added" });
            await loadFavoriteRoutes();
            setView("favorites");
        } catch (error) {
            toast.error(getErrorMessage(error, "Unable to add route to favorites."));
        }
    };

    const removeRoute = async (routeId: number) => {
        try {
            // DELETE /users/me/favorite-routes/:routeId
            await api.delete(`/users/me/favorite-routes/${routeId}`);
            toast.success("Route removed from favorites.", { id: "fav-route-removed" });
            await loadFavoriteRoutes();
        } catch (error) {
            toast.error(getErrorMessage(error, "Unable to remove route from favorites."));
        }
    };

    // ── Profile actions ───────────────────────────────────────────────────────

    const handleUpdateProfile = () => {
        setUser((prev) => ({
            ...prev,
            firstName: editData.firstName,
            lastName: editData.lastName,
            image: editData.image,
        }));
        toast.success("Profile updated successfully ✅");
        setView("profile");
    };

    const handleChangePassword = () => {
        if (!passwordData.newPassword || !passwordData.confirmPassword || !passwordData.oldPassword) {
            toast.error("Please fill all fields");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        toast.success("Password changed successfully 🔐");
        setPasswordData({ newPassword: "", confirmPassword: "", oldPassword: "" });
        setView("profile");
    };

    const handleSignOut = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        toast.success("Signed out successfully");
        router.push("/login");
    };

    const profileActionItems: ProfileActionItem[] = [
        {
            id: "edit-profile",
            label: "Edit Profile",
            iconSrc: "/icons/user1.svg",
            iconAlt: "Edit",
            onClick: () => setView("editProfile"),
        },
        {
            id: "change-password",
            label: "Change Password",
            iconSrc: "/icons/lock.svg",
            iconAlt: "Change Password",
            onClick: () => setView("changePassword"),
        },
        {
            id: "language",
            label: "Language",
            iconSrc: "/icons/globe.svg",
            iconAlt: "Language",
        },
        {
            id: "toggle-theme",
            label: isDarkMode ? "Light Mode" : "Dark Mode",
            iconSrc: isDarkMode ? "/icons/sun.svg" : "/icons/moon.svg",
            iconAlt: isDarkMode ? "Light Mode" : "Dark Mode",
            onClick: toggleTheme,
        },
        {
            id: "sign-out",
            label: "Sign Out",
            iconSrc: "/icons/signout.svg",
            iconAlt: "Sign Out",
            onClick: handleSignOut,
            danger: true,
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <section className="">
            <ProfileHeader
                firstName={user.firstName}
                lastName={user.lastName}
                image={user.image}
                role="Passenger"
            />

            <div className="flex gap-4 mt-6 justify-center">
                <button
                    className="w-27.5 h-14.25 bg-white rounded-md text-[#4CAF8A] font-bold text-md hover:bg-gray-200"
                    onClick={() => setView("favorites")}
                >
                    FavRoutes
                </button>
                <button
                    className="w-27.5 h-14.25 bg-white rounded-md font-bold text-md hover:bg-gray-200"
                    onClick={() => setView("feedback")}
                >
                    Feedbacks
                </button>
            </div>

            <ProfileActionList items={profileActionItems} />

            {/* ── Favorites modal ── */}
            {view === "favorites" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="h-150 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Favorite Routes</h2>
                            <button className="rounded bg-red-500 hover:bg-red-600 p-1" onClick={() => setView("profile")}>
                                <CgClose size={15} color="white" />
                            </button>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button className="rounded bg-green-600 hover:bg-green-700 p-1" onClick={() => setView("addRoute")}>
                                <IoMdAdd size={16} color="white" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Search saved routes..."
                                value={favoriteSearch}
                                onChange={(e) => setFavoriteSearch(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {favoriteRoutesError && <p className="mt-3 text-sm text-red-600">{favoriteRoutesError}</p>}
                        {favoriteRoutesLoading && <p className="mt-5 text-sm text-gray-500">Loading favorite routes...</p>}

                        <ul className="space-y-2 mt-5">
                            {!favoriteRoutesLoading && favoriteRoutes.length === 0 ? (
                                <li className="rounded-md bg-gray-100 p-4 text-sm text-gray-500 shadow-sm">
                                    No favorite routes saved yet.
                                </li>
                            ) : null}

                            {favoriteRoutes.map((route) => (
                                <li key={route.id} className="rounded-md bg-gray-100 p-4 shadow-sm flex items-center gap-3">
                                    <img src="/icons/road.svg" alt="Route Icon" className="w-5 h-5" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-800">{route.routeName}</p>
                                        <p className="text-xs text-gray-500">{formatRouteSubtitle(route)}</p>
                                    </div>
                                    <button
                                        className="ml-auto rounded p-1 hover:bg-red-100"
                                        onClick={() => void removeRoute(route.id)}
                                    >
                                        <MdDelete size={22} color="red" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Add route modal ── */}
            {view === "addRoute" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl flex flex-col max-h-150">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Add Favorite Routes</h2>
                            <button className="rounded bg-red-500 hover:bg-red-600 p-1" onClick={() => setView("favorites")}>
                                <CgClose size={15} color="white" />
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search routes..."
                            value={routeSearch}
                            onChange={(e) => setRouteSearch(e.target.value)}
                            className="w-full rounded border px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {routeResultsError && <p className="mb-3 text-sm text-red-600">{routeResultsError}</p>}
                        {routeResultsLoading && <p className="text-sm text-gray-500">Searching routes...</p>}

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {!routeResultsLoading && routeResults.length === 0 ? (
                                <p className="text-sm text-gray-500">No routes found</p>
                            ) : (
                                routeResults.map((route) => (
                                    <div
                                        key={route.id}
                                        className="cursor-pointer rounded border px-3 py-2 hover:bg-blue-50 flex justify-between items-center"
                                    >
                                        <div className="min-w-0 pr-3">
                                            <p className="font-medium text-gray-800">{route.routeName}</p>
                                            <p className="text-xs text-gray-500">{formatRouteSubtitle(route)}</p>
                                        </div>
                                        <button
                                            className="rounded bg-green-600 hover:bg-green-700 p-1"
                                            onClick={() => void addRouteToFavorites(route)}
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

            {/* ── Feedback modal ── */}
            {view === "feedback" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="h-150 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">My Feedback</h2>
                            <button className="rounded bg-red-500 hover:bg-red-600 p-1" onClick={() => setView("profile")}>
                                <CgClose size={15} color="white" />
                            </button>
                        </div>

                        <ul className="space-y-3 mt-5">
                            {initialFeedback.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center">No feedback submitted yet</p>
                            ) : (
                                initialFeedback.map((item) => (
                                    <li key={item.id} className="rounded-md bg-gray-100 p-4 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="max-w-55">
                                                <p className="text-sm font-semibold text-[#122843]">{item.category}</p>
                                                <p className="text-xs text-gray-600">Bus: {item.busNumber}</p>
                                                <p className="text-gray-800 text-sm mt-1 truncate">{item.message}</p>
                                                <p className="text-xs text-gray-500 mt-2">{item.date}</p>
                                            </div>
                                            <button className="text-blue-600 text-sm underline" onClick={() => setSelectedFeedback(item)}>
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

            {/* ── Feedback detail modal ── */}
            {selectedFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">Feedback Details</h2>
                            <button className="bg-red-500 hover:bg-red-600 p-1 rounded" onClick={() => setSelectedFeedback(null)}>
                                <CgClose size={16} color="white" />
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-semibold">Category:</span> {selectedFeedback.category}</p>
                            <p><span className="font-semibold">Bus Number:</span> {selectedFeedback.busNumber}</p>
                            <p>
                                <span className="font-semibold">Rating:</span>{" "}
                                <span className="text-yellow-400">{"★".repeat(selectedFeedback.rating)}</span>
                            </p>
                            <p><span className="font-semibold">Message:</span></p>
                            <p className="bg-gray-100 p-3 rounded wrap-break-word whitespace-pre-wrap">{selectedFeedback.message}</p>
                            <p className="text-xs text-gray-500">{selectedFeedback.date}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit profile modal ── */}
            {view === "editProfile" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Edit Profile</h2>
                            <button className="bg-red-500 hover:bg-red-600 p-1 rounded" onClick={() => setView("profile")}>
                                <CgClose size={16} color="white" />
                            </button>
                        </div>
                        <div className="space-y-3 justify-center flex flex-col">
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
                            <img src={editData.image} className="w-20 h-20 rounded-full ml-40 border" />

                            {[
                                { label: "First Name", key: "firstName", type: "text" },
                                { label: "Last Name", key: "lastName", type: "text" },
                                { label: "Email", key: "email", type: "email" },
                                { label: "Phone Number", key: "phone", type: "text" },
                            ].map(({ label, key, type }) => (
                                <div key={key} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <label className="min-w-30 text-sm font-medium text-gray-700">{label}:</label>
                                    <input
                                        type={type}
                                        value={editData[key as keyof typeof editData]}
                                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                        placeholder={label}
                                        className="w-full max-w-75 px-3 py-2 rounded bg-[#1228430F]"
                                    />
                                </div>
                            ))}

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

            {/* ── Change password modal ── */}
            {view === "changePassword" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Change Password</h2>
                            <button className="bg-red-500 hover:bg-red-600 p-1 rounded" onClick={() => setView("profile")}>
                                <CgClose size={16} color="white" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { placeholder: "Old Password", key: "oldPassword" },
                                { placeholder: "New Password", key: "newPassword" },
                                { placeholder: "Confirm Password", key: "confirmPassword" },
                            ].map(({ placeholder, key }) => (
                                <input
                                    key={key}
                                    type="password"
                                    placeholder={placeholder}
                                    value={passwordData[key as keyof typeof passwordData]}
                                    onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            ))}
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
