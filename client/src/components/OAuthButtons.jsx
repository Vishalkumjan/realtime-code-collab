// client/src/components/OAuthButtons.jsx
import React from "react";

export default function OAuthButtons() {
  const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
  return (
    <div className="space-y-2">
      <a href={`${API}/api/auth/google`} className="inline-block px-4 py-2 bg-red-600 text-white rounded">
        Continue with Google
      </a>
      <a href={`${API}/api/auth/github`} className="inline-block px-4 py-2 bg-gray-800 text-white rounded">
        Continue with GitHub
      </a>
    </div>
  );
}
