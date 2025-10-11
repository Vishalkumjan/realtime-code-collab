// client/src/components/JoinRoom.jsx
import React, { useState } from "react";
import { socket, safeEmit } from "../socket";

function makeUsername() {
  return "User-" + Math.random().toString(36).slice(2, 7);
}
function makeColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 70% 60%)`;
}

export default function JoinRoom({ onJoin }) {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState(makeUsername());

  const join = (e) => {
    e.preventDefault();
    const id = (roomId || "room1").trim();
    const userData = { 
      roomId: id, 
      username: username.trim() || makeUsername(), 
      color: makeColor() 
    };
    
    console.log("🎯 JOINING ROOM:", userData);
    console.log("🔌 Socket status before join:", {
      connected: socket.connected,
      id: socket.id
    });
    
    safeEmit("join-room", userData);
    onJoin(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Join a Room</h2>
            <p className="text-gray-600 dark:text-gray-400">Enter a room ID to start collaborating</p>
          </div>

          <form onSubmit={join} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Room ID
              </label>
              <input 
                value={roomId} 
                onChange={(e) => setRoomId(e.target.value)} 
                placeholder="e.g., team-project-01" 
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow" 
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Leave empty for a random room ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Display Name
              </label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-shadow" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join Room
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Share the same Room ID with others to collaborate in real-time!</p>
                <p className="text-xs opacity-75">All users in the same room can edit code and chat together.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}