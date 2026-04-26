"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaLongArrowAltRight } from "react-icons/fa";
import { CgClose } from "react-icons/cg";
import toast from "react-hot-toast";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileActionList, { type ProfileActionItem } from "../../components/profile/ProfileActionList";
import { useBusTheme } from "../BusThemeContext";

export default function BusProfilePage() {
    const router = useRouter();
    const { isDarkMode, toggleTheme } = useBusTheme();
    const [view, setView] = useState<"profile" | "editProfile" | "changePassword">("profile");
    const [bus, setBus] = useState({
  type: "Semi Luxury",
  route: "138",
  origin: "Homagama",
  destination: "Pettah",
  seats: 45,
  busId: "NA-1879",
  registrationNumber: "WP NA-1879",
  finishedTripsToday: 6,
    contactNumber: "0771234567",
    email: "bus138@routeme.lk",
  profilePicture: "/icons/bus.png",
});

        const [editData, setEditData] = useState({
            contactNumber: bus.contactNumber,
            email: bus.email,
        });

        const [passwordData, setPasswordData] = useState({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        const handleUpdateProfile = () => {
            setBus((prev) => ({
                ...prev,
                contactNumber: editData.contactNumber,
                email: editData.email,
            }));

            toast.success("Profile updated successfully ✅");
            setView("profile");
        };

        const handleChangePassword = () => {
            if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                toast.error("Please fill all fields");
                return;
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast.error("Passwords do not match");
                return;
            }

            toast.success("Password changed successfully 🔐");
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setView("profile");
        };

        const handleSignOut = () => {
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

    return (
        <section className="space-y-2 pb-10">
            <ProfileHeader
                firstName={bus.registrationNumber}
                lastName=""
                image={bus.profilePicture}
                role="Bus"
            />
                        <ProfileActionList items={profileActionItems} />

            <h3 className="text-md font-bold text-[#94A0AE] ml-10 mt-10">BUS DETAILS</h3>

            <div className="flex flex-row gap-5 items-start justify-center">
                <div className="flex flex-col gap-4">
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Bus Number</p>
                    <p className="text-black font-semibold">{bus.registrationNumber}</p>
                </div>
                
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Total Seats</p>
                    <p className="text-black font-semibold">{bus.seats}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="flex text-[#94A0AE] font-semibold gap-1 items-center">Origin <FaLongArrowAltRight size={10}/>Dest.</p>
                    <p className="flex text-black font-semibold gap-1 items-center">{bus.origin} <FaLongArrowAltRight size={10}/> {bus.destination}</p>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Registration</p>
                    <p className="text-black font-semibold">{bus.registrationNumber}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Type</p>
                    <p className="text-black font-semibold">{bus.type}</p>
                </div>
                <div className =" justify-between w-100 items-center flex p-4 rounded-lg bg-white">
                    <p className="text-[#94A0AE] font-semibold">Assigned Route</p>
                    <p className="text-black font-semibold">{bus.route}</p>
                </div>
            </div>
            </div>

            {view === "editProfile" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Edit Profile</h2>
                            <button
                                className="bg-red-500 hover:bg-red-600 p-1 rounded"
                                onClick={() => setView("profile")}
                            >
                                <CgClose size={16} color="white" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Registration Number</label>
                                <input
                                    type="text"
                                    value={bus.registrationNumber}
                                    disabled
                                    className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Bus Type</label>
                                <input
                                    type="text"
                                    value={bus.type}
                                    disabled
                                    className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Assigned Route</label>
                                <input
                                    type="text"
                                    value={bus.route}
                                    disabled
                                    className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Total Seats</label>
                                <input
                                    type="text"
                                    value={String(bus.seats)}
                                    disabled
                                    className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Contact Number</label>
                                <input
                                    type="text"
                                    value={editData.contactNumber}
                                    onChange={(e) => setEditData({ ...editData, contactNumber: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>

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
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Change Password</h2>
                            <button
                                className="bg-red-500 hover:bg-red-600 p-1 rounded"
                                onClick={() => setView("profile")}
                            >
                                <CgClose size={16} color="white" />
                            </button>
                        </div>

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