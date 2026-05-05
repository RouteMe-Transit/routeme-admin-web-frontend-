"use client";

import React, { useState } from "react";

const roles = ["Passenger", "Driver", "Admin"];

export default function LoginPage() {
  const [role, setRole] = useState("Passenger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        window.location.href = "/admin/dashboard";
      } else {
        alert(`${data.message || "Login failed"}`);
      }

    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
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
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${role === r
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
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
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
            Don't have an account?{" "}
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
