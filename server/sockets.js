import { Server } from "socket.io";

let io;

const usersInRoom = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Dev ke liye *, production me apna client URL dalna
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000, // higher ping timeout
    pingInterval: 5000,
  });

  io.on("connection", (socket) => {
    console.log("🎉 NEW USER CONNECTED:", socket.id);
    console.log("📊 Total connections:", io.engine.clientsCount);

    socket.on("join-room", (data) => {
      console.log("🚀 JOIN-ROOM EVENT RECEIVED:", data);
      const { roomId, username, color } = data;
      if (!roomId || !username) return;

      const user = { username, color };

      // Leave previous rooms
      Object.keys(socket.rooms).forEach(room => {
        if (room !== socket.id) socket.leave(room);
      });

      socket.join(roomId);
      if (!usersInRoom[roomId]) usersInRoom[roomId] = [];

      const existingUserIndex = usersInRoom[roomId].findIndex(u => u.id === socket.id);
      if (existingUserIndex !== -1) usersInRoom[roomId][existingUserIndex] = { id: socket.id, ...user };
      else usersInRoom[roomId].push({ id: socket.id, ...user });

      socket.to(roomId).emit("receive-message", {
        senderName: 'System',
        text: `${user.username} joined the room`,
      });

      io.to(roomId).emit("user-update", usersInRoom[roomId]);
    });

    socket.on("leave-room", (data) => {
      const { roomId } = data;
      if (!roomId) return;
      socket.leave(roomId);

      if (usersInRoom[roomId]) {
        const userIndex = usersInRoom[roomId].findIndex(u => u.id === socket.id);
        if (userIndex !== -1) {
          const leavingUser = usersInRoom[roomId].splice(userIndex, 1)[0];
          socket.to(roomId).emit("receive-message", {
            senderName: 'System',
            text: `${leavingUser.username} left the room`,
          });
          io.to(roomId).emit("user-update", usersInRoom[roomId]);
        }
      }
    });

    socket.on('get-users', (roomId) => {
      const users = usersInRoom[roomId] || [];
      socket.emit('user-update', users);
    });

    socket.on("send-message", (data) => {
      const { roomId, message } = data;
      const sender = usersInRoom[roomId]?.find(u => u.id === socket.id);
      io.to(roomId).emit("receive-message", {
        senderName: sender ? sender.username : 'Guest',
        text: message,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("code-change", (data) => {
      const { roomId, code } = data;
      socket.to(roomId).emit("code-change", { code, sender: socket.id });
    });

    socket.on("disconnect", (reason) => {
      console.log("👋 USER DISCONNECTED:", socket.id, "Reason:", reason);
      for (const roomId in usersInRoom) {
        const userIndex = usersInRoom[roomId].findIndex(u => u.id === socket.id);
        if (userIndex !== -1) {
          const disconnectedUser = usersInRoom[roomId].splice(userIndex, 1)[0];
          socket.to(roomId).emit("receive-message", {
            senderName: 'System',
            text: `${disconnectedUser.username} left the room`,
          });
          io.to(roomId).emit("user-update", usersInRoom[roomId]);
        }
      }
    });
  });

  console.log("✅ Socket.io server initialized");
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
