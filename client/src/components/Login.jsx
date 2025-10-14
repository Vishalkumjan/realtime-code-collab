// client/components/Login.jsx
import React, { useState } from "react";
import { login } from "../api/auth";
import { connectSocketWithToken } from "../socket";
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';
import axios from 'axios';

// FIXED: Production backend URL properly configured
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://realtime-code-collab-btbh.onrender.com' 
    : 'http://localhost:3001');

export default function Login({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    setNeedsVerificationEmail(null);

    try {
      const payload = { email: email.trim(), password };
      const { token, user } = await login(payload);
      
      localStorage.setItem("token", token);
      connectSocketWithToken(token);
      onAuth({ token, user });
      toast.success('Logged in successfully! Welcome back.');

    } catch (e) {
      setLoading(false);
      const responseData = e.response?.data;
      
      let msg = responseData?.message || e.message || "Login failed";
      
      if (responseData?.emailNotVerified) {
        setNeedsVerificationEmail(responseData.email);
        msg = "Please verify your email to log in.";
      }

      setErr(msg);
      toast.error(msg);
    }
  };

  const handleResendVerification = async () => {
    if (!needsVerificationEmail) return;

    try {
      toast.loading('Sending verification link...', { id: 'resend' });
      await axios.post(`${SERVER_URL}/api/auth/resend-verification`, { 
        email: needsVerificationEmail 
      });
      toast.success('Verification link sent again! Check your inbox.', { id: 'resend' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend link. Try again later.';
      toast.error(errorMessage, { id: 'resend' });
    }
  };

  const googleLogin = () => {
    // FIXED: Correct OAuth URL
    window.location.href = `${SERVER_URL}/api/auth/google`;
  };

  const githubLogin = () => {
    // FIXED: Correct OAuth URL
    window.location.href = `${SERVER_URL}/api/auth/github`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome Back</h2>
            <p className="text-gray-600 dark:text-gray-400">Sign in to continue coding together</p>
          </div>

          {/* Email Verification Alert */}
          {needsVerificationEmail && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm" role="alert">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Verification Required!
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Please check your email inbox for the verification link.
              </p>
              <button
                onClick={handleResendVerification}
                className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium transition duration-200"
              >
                Resend Verification Email
              </button>
            </div>
          )}
          
          {/* Login Error Alert */}
          {err && !needsVerificationEmail && (
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
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow"
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <input
                required
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow"
                autoComplete="current-password"
              />
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-right pt-1">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300 dark:bg-dark-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or continue with</span>
            <div className="flex-grow h-px bg-gray-300 dark:bg-dark-600"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={googleLogin}
              type="button"
              className="google-btn w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <button
              onClick={githubLogin}
              type="button"
              className="github-btn w-full"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>
          
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}