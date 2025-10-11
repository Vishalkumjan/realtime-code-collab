const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // join-room: payload { roomId, username, color }
  socket.on("join-room", (payload) => {
    const { roomId, username, color } = payload || {};
    if (!roomId) {
      console.warn("[server] join-room called without roomId by", socket.id);
      return;
    }

    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { users: {}, code: "// New room\n" };
    }

    // add or update user to room's user list
    rooms[roomId].users[socket.id] = {
      id: socket.id,
      username: username || socket.id,
      color: color || "#" + Math.floor(Math.random() * 16777215).toString(16),
    };

    console.log(`User ${socket.id} joined room ${roomId} as ${rooms[roomId].users[socket.id].username}`);

    // send current code to joining client only
    socket.emit("load-code", rooms[roomId].code);

    // broadcast updated user list to room
    const userList = Object.values(rooms[roomId].users);
    io.in(roomId).emit("user-update", userList);
  });

  // allow explicit leave-room
  socket.on("leave-room", (payload) => {
    const { roomId } = payload || {};
    if (!roomId) return;
    if (rooms[roomId] && rooms[roomId].users[socket.id]) {
      delete rooms[roomId].users[socket.id];
      const userList = Object.values(rooms[roomId].users);
      io.in(roomId).emit("user-update", userList);
      console.log(`User ${socket.id} left room ${roomId}`);
      // cleanup empty room
      if (Object.keys(rooms[roomId].users).length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }
    try {
      socket.leave(roomId);
    } catch (e) {}
  });

  // code-change: { roomId, code } - save and broadcast to others in room
  socket.on("code-change", ({ roomId, code }) => {
    if (!roomId || typeof code !== "string") return;
    if (!rooms[roomId]) rooms[roomId] = { users: {}, code };
    rooms[roomId].code = code;
    socket.to(roomId).emit("code-change", { code, sender: socket.id });
  });

  // cursor-change: { roomId, selection } - broadcast cursor update to others
  socket.on("cursor-change", ({ roomId, selection }) => {
    if (!roomId || !rooms[roomId] || !rooms[roomId].users[socket.id]) return;
    const user = rooms[roomId].users[socket.id];
    const payload = {
      sender: socket.id,
      username: user.username,
      color: user.color,
      selection,
    };
    socket.to(roomId).emit("cursor-update", payload);
  });

  // chat messages: { roomId, message } - FIXED: Added senderId field
  socket.on("send-message", ({ roomId, message }) => {
    if (!roomId || !message || !message.trim()) {
      return;
    }
    const user = rooms[roomId] && rooms[roomId].users[socket.id];
    const payload = { 
      senderId: socket.id,  // ✅ FIXED: Added senderId field
      senderName: (user && user.username) || "Guest", 
      text: message, 
      createdAt: new Date().toISOString() 
    };
    io.in(roomId).emit("receive-message", payload); // broadcast to all in room, all tabs receive it
  });

  // handle socket leaving rooms on disconnecting (socket.rooms is a Set)
  socket.on("disconnecting", () => {
    const roomsToLeave = Array.from(socket.rooms || []).filter((r) => r !== socket.id);
    roomsToLeave.forEach((roomId) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        delete rooms[roomId].users[socket.id];
        const userList = Object.values(rooms[roomId].users);
        io.in(roomId).emit("user-update", userList);
        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});