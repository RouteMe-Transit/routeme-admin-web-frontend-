//signup page

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data);
        setShowSuccess(true); 
        alert("Signup successful!");
      } else {
        alert(data.message || "Signup failed");
      }

    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      {/* Signup Card */}
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-lg border">
        <h1 className="text-3xl font-bold text-center mb-2">
          Create Account
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Join RouteMe as a Passenger
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* First + Last Name */}
          <div className="flex gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              required
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              required
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />

          {/* Phone */}
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
          >
            Create Account
          </button>
        </form>

        {/* Sign In */}
        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-green-500 font-semibold hover:underline">
            Log In
          </a>
        </p>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-10 rounded-2xl shadow-xl text-center w-[350px]">

            <h2 className="text-2xl font-bold mb-4">
              Account Created Successfully!
            </h2>

            <button
              onClick={() => {
                setShowSuccess(false);
                router.push("/login");
              }}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            >
              Log In →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
