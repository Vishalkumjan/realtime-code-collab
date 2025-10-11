// client/src/components/Register.jsx

import React, { useState } from "react";
import { register } from "../api/auth";
// import { connectSocketWithToken } from "../socket"; // Not needed on register success now
import { Link } from "react-router-dom";
import toast from 'react-hot-toast'; // --- NEW IMPORT ---

export default function Register({ onAuth }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  // --- NEW STATE for success message ---
  const [registeredEmail, setRegisteredEmail] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    setRegisteredEmail(null); // Reset success message

    try {
      const payload = {
        email: email.trim(),
        displayName: displayName.trim(),
        password,
      };

      // 1. Check for password strength/length (Good Practice)
      if (password.length < 8) {
        setErr("Password must be at least 8 characters long.");
        toast.error("Password must be at least 8 characters long.");
        setLoading(false);
        return;
      }

      // 2. Call Register API
      const response = await register(payload);

      // --- CRITICAL CHANGE: Stop automatic login ---
      // Instead of logging in, show success message
      setRegisteredEmail(email);
      setEmail('');
      setDisplayName('');
      setPassword('');
      toast.success(response.message || 'Registration successful! Check your email.');

    } catch (e) {
      const msg =
        (e && e.response && (e.response.data?.message || e.response.data)) ||
        (e && e.message) ||
        "Registration failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Account</h2>
            <p className="text-gray-600 dark:text-gray-400">Join and start collaborating</p>
          </div>

          {/* --- NEW: Registration Success Message --- */}
          {registeredEmail ? (
            <div className="text-center">
              <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-bold text-lg text-green-800 dark:text-green-200 mb-2">🎉 Verification Email Sent!</p>
                <p className="text-green-700 dark:text-green-300">
                  Please check your inbox at <span className="font-semibold">{registeredEmail}</span> to verify your account and complete registration.
                </p>
              </div>
              <Link to="/" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Go to Login Page
              </Link>
            </div>
          ) : (
            <>
              {/* Error Alert (Only visible if not successful) */}
              {err && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800 dark:text-red-200">{err}</p>
                  </div>
                </div>
              )}
          
              <form onSubmit={submit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition-shadow"
                  />
                </div>

                {/* Display Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition-shadow"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password (Min 8 characters)
                  </label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition-shadow"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>
            </>
          )}
          
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/" className="text-green-600 dark:text-green-400 hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}