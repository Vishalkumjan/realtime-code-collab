// client/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // Assuming you use react-hot-toast

// SERVER_URL is set to the base server address (e.g., http://localhost:3001)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001"; 

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        toast.dismiss(); // Clear existing toasts

        try {
            // ROUTING FIX APPLIED: Hitting the correct /api/auth endpoint
            const response = await axios.post(`${SERVER_URL}/api/auth/forgot-password`, { email }); 
            
            setMessage(response.data.message || 'Password reset link sent! Check your inbox.');
            toast.success('Password reset link sent! Check your email.');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
                    
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Forgot Password</h2>
                        <p className="text-gray-600 dark:text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 ${message.includes('sent') ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-lg text-sm`} role="alert">
                            <p className={`font-medium ${message.includes('sent') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                {message}
                            </p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email Address
                            </label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow"
                                autoComplete="email"
                                disabled={loading || message.includes('sent')}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`w-full py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors ${loading || message.includes('sent') ? "opacity-60 cursor-not-allowed" : ""}`}
                            disabled={loading || message.includes('sent')}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </span>
                            ) : "Send Reset Link"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Remembered your password?{" "}
                        <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;