// client/src/pages/ResetPassword.jsx - FIXED VERSION

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const ResetPassword = () => {
    const { token } = useParams(); // FIXED: useParams instead of useSearchParams
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (!token) {
            toast.error('Missing reset token. Please use the link from your email.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                `${SERVER_URL}/api/auth/reset-password/${token}`, 
                { password }
            );
            
            toast.success(response.data.message || 'Password reset successful!');
            navigate('/login');

        } catch (error) {
            console.error("Reset Password Error:", error);
            const errorMessage = error.response?.data?.message || 'Failed to reset password. Token might be invalid or expired.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-dark-700">
                
                <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-gray-100 text-center">
                    Set New Password
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                    Enter a secure password to reset your account.
                </p>

                {!token && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                        <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                            Token missing from URL. Please check the link sent to your email.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            New Password (min 8 characters)
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={!token}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow disabled:opacity-50"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={!token}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token || !password || !confirmPassword || password !== confirmPassword}
                        className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform hover:scale-[1.01] hover:shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Resetting...
                            </span>
                        ) : 'Reset Password'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;