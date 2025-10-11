// client/pages/OAuthRedirect.jsx - FINAL FIXED CODE

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OAuthRedirect = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. URL se token aur status nikalna
        const token = searchParams.get('token');
        const status = searchParams.get('status');
        const errorMessage = searchParams.get('message'); // Server se aaya hua error message

        // Token aur status check
        if (token && status === 'success') {
            // 2. Token ko localStorage mein save karna
            localStorage.setItem('userToken', token);
            
            // 3. Success message aur redirect
            toast.success('Login successful! Welcome back.');
            
            // User ko dashboard ya home page par bhej do
            navigate('/dashboard', { replace: true });

        } else if (errorMessage || status === 'failed' || status === 'error') {
            // 4. Failure ya error handle karna
            const provider = searchParams.get('provider');
            let failureMessage = 'OAuth login failed. Please try again.';

            if (provider) {
                failureMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed.`;
            } else if (errorMessage) {
                // Agar server se specific message aaya ho
                failureMessage = errorMessage.replace(/_/g, ' '); 
            }
            
            toast.error(failureMessage);
            
            // User ko login page par wapas bhej do
            navigate('/login', { replace: true });
        
        } else {
            // Jab koi token ya error na ho, phir bhi login page par bhej do
            toast.error('Authentication process failed. Missing token.');
            navigate('/login', { replace: true });
        }

    }, [searchParams, navigate]);

    // UI for a brief loading screen
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <h1 className="text-xl font-semibold text-white">
                    Processing secure login...
                </h1>
                <p className="text-gray-400 text-sm mt-2">Please wait, you'll be redirected shortly.</p>
            </div>
        </div>
    );
};

export default OAuthRedirect;