// client/src/socket.js (CORRECTED)
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

console.log("🔧 Socket.js loading...");
console.log("🌐 Server URL:", SERVER_URL);

let eventQueue = [];

// FIX: autoConnect true aur polling first
export const socket = io(SERVER_URL, {
  transports: ["polling", "websocket"], // IMPORTANT: polling first
  autoConnect: true, // IMPORTANT: auto connect
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000,
});

console.log("🔌 Socket created");

socket.on("connect", () => {
  console.log("✅ SOCKET CONNECTED:", socket.id);
  
  if (eventQueue.length > 0) {
    console.log(`🔄 Flushing ${eventQueue.length} queued events`);
    eventQueue.forEach(({ eventName, data }) => {
      socket.emit(eventName, data);
    });
    eventQueue = [];
  }
});

socket.on("disconnect", (reason) => {
  console.log("❌ SOCKET DISCONNECTED:", reason);
});

socket.on("connect_error", (error) => {
  console.error("💥 CONNECTION ERROR:", error.message);
});

export function connectSocketWithToken(token) {
  console.log("🔑 Connecting with token");
  socket.auth = { token: token || "" };
  if (!socket.connected) {
    socket.connect();
  }
}

export function getSocket() {
  return socket;
}

export function safeEmit(eventName, data) {
  console.log("📤 safeEmit:", eventName, "Connected:", socket.connected);
  
  if (socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.log("⏳ Queueing:", eventName);
    eventQueue.push({ eventName, data });
  }
}

export function disconnectSocket() {
  try {
    eventQueue = [];
    socket.disconnect();
  } catch (e) {}
}