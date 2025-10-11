// client/src/pages/VerifyEmail.jsx - FINAL WORKING VERSION

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('⏳ Verifying Email...');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setStatus('❌ Error: Verification token not found.');
            setIsLoading(false);
            toast.error('Invalid verification link.');
            return;
        }

        const verifyToken = async () => {
            try {
                console.log("Sending verification request for token:", token);
                
                const response = await axios.get(
                    `${SERVER_URL}/api/auth/verify-email/${token}`
                );
                
                console.log("Verification response:", response.data);
                
                setStatus('✅ Email verified successfully!');
                setSuccess(true);
                setIsLoading(false);
                toast.success('Account verified! You can now log in.');
                
                // Auto redirect after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);

            } catch (error) {
                console.error("Verification Error:", error);
                setIsLoading(false);
                
                // Check if it's a "already verified" error or token expired
                const errorMessage = error.response?.data?.message 
                    || error.message
                    || 'Verification failed. The link might be expired or invalid.';
                
                // If already verified, show success message
                if (errorMessage.includes('already verified') || errorMessage.includes('already')) {
                    setStatus('✅ Email already verified! You can log in now.');
                    setSuccess(true);
                    toast.success('Email already verified!');
                    
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus(`❌ ${errorMessage}`);
                    setSuccess(false);
                    toast.error(errorMessage);
                }
            }
        };

        verifyToken();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-800 p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md text-center border border-gray-200 dark:border-dark-700">
                
                <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-gray-100">
                    {success ? '✅ Verification Complete' : '⏳ Verifying...'}
                </h1>
                
                <p className={`mb-8 text-lg font-medium ${
                    success 
                        ? 'text-green-600 dark:text-green-400' 
                        : status.includes('Error') || status.includes('❌')
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                    {status}
                </p>

                {success ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Redirecting to login in 3 seconds...
                        </p>
                        <Link 
                            to="/login" 
                            className="w-full inline-block py-3 px-6 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 shadow-md transform hover:scale-[1.01]"
                        >
                            Go to Login Now
                        </Link>
                    </div>
                ) : isLoading ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-12 w-3/4 mx-auto rounded-lg"></div>
                ) : (
                    <div className="space-y-3">
                        <Link 
                            to="/" 
                            className="block text-primary-600 dark:text-primary-400 hover:underline transition duration-200 text-sm font-medium"
                        >
                            Return to Home
                        </Link>
                        <Link 
                            to="/register" 
                            className="block text-primary-600 dark:text-primary-400 hover:underline transition duration-200 text-sm font-medium"
                        >
                            Register Again
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;