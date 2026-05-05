"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CgClose } from "react-icons/cg";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileActionList, { type ProfileActionItem } from "../../components/profile/ProfileActionList";
import { useAdminTheme } from "../AdminThemeContext";


export default function AdminProfilePage() {
  const router = useRouter();

  const { isDarkMode, toggleTheme } = useAdminTheme();
  const [user, setUser] = useState({
    firstName: "Kavindra",
    lastName: "Senarathne",
    image: "/default-profile-image.svg",
  });
  const [view, setView] = useState<"profile" | "editProfile" | "changePassword">("profile");
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

  const [editData, setEditData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: "",
    phone: "",
    image: user.image,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const handleChangePassword = () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // simulate success (later replace with API)
    toast.success("Password changed successfully 🔐");

    setPasswordData({ newPassword: "", confirmPassword: "" });
    setView("profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  };
  return (
    <section className="space-y-2">
      <div className="bg-[#1228430F] w-full h-72 border-b border-gray-300 shadow-sm flex justify-center flex-col items-center">
        <img
          src={user.image}
          alt="Profile"
          className="w-32 h-32 rounded-full border border-gray-300 mt-10 object-cover"
        />
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
    <section className="space-y-2">
      <ProfileHeader
        firstName={user.firstName}
        lastName={user.lastName}
        image={user.image}
        role="Admin"
      />

      <div className="flex flex-col items-center mt-10 gap-0">
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
        <button className="w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 border-b border-gray-300 hover:bg-gray-200">
          <img src="/icons/moon.svg" alt="Dark Mode" className="inline-block w-8 h-8 mr-5" />
          Dark Mode
        </button>
        <button onClick={handleLogout} className="w-75 h-12.5 bg-white font-bold text-md flex items-center pl-10 rounded-b-md hover:bg-gray-200">
          <img src="/icons/signout.png" alt="Sign Out" className="inline-block w-8 h-8 mr-5" />
          Sign Out
        </button>

      </div>

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
      <ProfileActionList items={profileActionItems} className="flex flex-col items-center mt-10 gap-0" />

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