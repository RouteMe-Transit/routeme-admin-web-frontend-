"use client";
import api from "@/app/services/api";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp" | "newPassword";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const getErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      return (
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Something went wrong. Please try again."
      );
    }
    return "Something went wrong. Please try again.";
  };

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setInfo(res.data?.message || "If an account exists for that email, a reset code has been sent.");
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-otp", { email, otp });
      setStep("newPassword");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmNewPassword,
      });
      router.push("/login?reset=success");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setInfo(res.data?.message || "A new code has been sent.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Reset Password
        </h1>
        <p className="text-center text-sm text-gray-500 mt-2">
          {step === "email" && "Enter your email to receive a reset code"}
          {step === "otp" && "Enter the 6-digit code we sent you"}
          {step === "newPassword" && "Choose a new password"}
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          {(["email", "otp", "newPassword"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-10 rounded-full ${
                ["email", "otp", "newPassword"].indexOf(step) >= i
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            {info}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                6-digit code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center tracking-[0.5em] font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="w-full text-sm text-green-600 hover:underline disabled:opacity-60"
            >
              Resend code
            </button>
          </form>
        )}

        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6 text-gray-600">
          Remembered your password?{" "}
          <a href="/login" className="text-green-500 font-semibold hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
