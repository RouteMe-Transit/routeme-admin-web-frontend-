"use client";

import api from "@/app/services/api";
import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { z } from "zod";

const roles = ["Passenger", "Driver", "Admin"];

const loginSchema = z.object({
  identifier: z.string().min(1, "Required field"),

  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [role, setRole] = useState("Passenger");

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({
      identifier,
      password,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        identifier: fieldErrors.identifier?.[0],
        password: fieldErrors.password?.[0],
      });

      // Toast Errors
      if (fieldErrors.identifier?.[0]) {
        toast.error(fieldErrors.identifier[0]);
      }

      if (fieldErrors.password?.[0]) {
        toast.error(fieldErrors.password[0]);
      }

      return;
    }

    setErrors({});

    try {
      const payload =
        role === "Driver"
          ? {
              role,
              registrationNumber: identifier,
              password,
            }
          : {
              role,
              email: identifier,
              password,
            };


      const response = await api.post("/auth/login", payload);

      toast.success("Login successful");

      const data = response.data;

      const userRole = data.data.user.role;

      // Save Data
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // Redirect
      setTimeout(() => {
        if (userRole === "admin") {
          window.location.href = "/admin/dashboard";
        } else if (userRole === "passenger") {
          window.location.href = "/passenger/liveTracking";
        } else if (userRole === "bus") {
          window.location.href = "/bus/trip";
        } else {
          window.location.href = "/";
        }
      }, 1000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<unknown>;
        const responseData = axiosError.response?.data as { message?: string } | undefined;

        toast.error(responseData?.message || "Login failed");
      } else {
        toast.error("Unexpected error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Login Card */}
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-xl border">
        <h1 className="text-3xl font-bold text-center mb-8">
          Login to Your Account
        </h1>

        {/* Role Panels */}
        <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setIdentifier("");
                setPassword("");
                setErrors({});
              }}
              className={`py-3 rounded-xl font-medium transition-all duration-200 ${
                role === r
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dynamic Identifier */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {role === "Driver" ? "Bus Number" : "Email"}
            </label>

            <input
              type={role === "Driver" ? "text" : "email"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                role === "Driver" ? "Enter bus number" : "Enter email"
              }
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.identifier
                  ? "border-red-500 focus:ring-red-400"
                  : "focus:ring-green-400"
              }`}
            />

            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-400"
                    : "focus:ring-green-400"
                }`}
              />

              {/* Show/Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            {role === "Passenger" && (
          <p className="text-center text-sm mt-6 text-gray-600">
            Forgot your password?{" "}
            <a
              href="/reset-password"
              className="text-green-500 font-semibold hover:underline"
            >
              Reset Password
            </a>
          </p>
        )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition"
          >
            Login as {role}
          </button>
        </form>

        {/* Passenger Signup */}
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
