// client/src/App.jsx

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { socket, connectSocketWithToken, disconnectSocket } from "./socket";
import Login from "./components/Login";
import Register from "./components/Register";
import { me } from "./api/auth";
import Dashboard from "./pages/Dashboard";
import Editor from "./Editor";

import toast from 'react-hot-toast';


// Email verification & password reset imports
import VerifyEmail from "./pages/VerifyEmail"; 
import ForgotPassword from "./pages/ForgotPassword"; 
import ResetPassword from "./pages/ResetPassword";

// OAuth Callback Component
function OAuthCallback({ onAuth }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const status = searchParams.get('status'); 
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error || status === 'failed') {
        const displayMessage = message || error || "OAuth login failed. Try again.";
        toast.error(displayMessage.replace(/_/g, ' '));
        navigate('/login');
        return;
    }

    if (token && status === 'success') {
      me(token)
        .then((user) => {
          localStorage.setItem('token', token);
          connectSocketWithToken(token);
          onAuth({ token, user });
          toast.success('Login successful!');
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error("Token verification failed:", err);
          localStorage.removeItem('token');
          toast.error('Token verification failed. Please log in again.');
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, onAuth]);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-900 dark:text-gray-100">Authenticating...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      connectSocketWithToken(t);
      me(t)
        .then((u) => {
          setAuthUser(u);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          disconnectSocket();
          setToken(null);
          setAuthUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });
    return () => {
      socket.off("connect");
    };
  }, []);

  const onAuth = ({ token: t, user }) => {
    localStorage.setItem("token", t);
    setToken(t);
    setAuthUser(user);
    connectSocketWithToken(t);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    disconnectSocket();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Base Route */}
      {authUser ? (
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      ) : (
        <Route path="/" element={<Login onAuth={onAuth} />} />
      )}
      
      {/* Public Auth Routes */}
      <Route path="/register" element={<Register onAuth={onAuth} />} />
      <Route path="/oauth-redirect" element={<OAuthCallback onAuth={onAuth} />} />

      {/* 🔥 CRITICAL FIX: Email verification & password reset routes with token parameter */}
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          authUser ? (
            <Dashboard onAuth={onAuth} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/editor"
        element={
          authUser ? (
            <Editor />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}