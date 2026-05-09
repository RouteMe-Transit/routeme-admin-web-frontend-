"use client";

import api from "@/app/services/api";
import axios, { AxiosError } from "axios";
import React, { useState } from "react";

const roles = ["Passenger", "Driver", "Admin"];

export default function LoginPage() {
  const [role, setRole] = useState("Passenger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        role,
        email,
        password,
      });

      const data = response.data;

      const userRole = data.data.user.role;

      console.log("User role:", userRole, "ujklhj", data.data.user);
      if (userRole === "admin") {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        window.location.href = "/admin/dashboard";
      } else if (userRole === "passenger") {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        window.location.href = "/passenger/liveTracking";
      } else if (userRole === "bus") {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        window.location.href = "/bus/trip";
      } else {
        window.location.href = "/";
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;

        alert((axiosError.response?.data as any)?.message || "Login failed");
      } else {
        alert("Unexpected error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Bigger Card */}
      <div className="bg-white shadow-2xl rounded-2xl p-12 w-full max-w-xl border">
        <h1 className="text-3xl font-bold text-center mb-8">
          Login to Your Account
        </h1>

        {/* Role Selector */}
        <div className="flex justify-between mb-8">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                role === r
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg text-lg hover:bg-green-600 transition"
          >
            Login as {role}
          </button>
        </form>

        {/* Show ONLY for Passenger */}
        {role === "Passenger" && (
          <p className="text-center text-sm mt-6 text-gray-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signUp"
              className="text-green-500 font-semibold hover:underline"
            >
              Sign Up
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
