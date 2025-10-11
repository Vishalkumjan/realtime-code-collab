// client/src/utils/socket.js - CREATE NEW FILE
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const safeEmit = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`Socket not connected, cannot emit '${event}'`);
  }
};