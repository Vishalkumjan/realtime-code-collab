require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const passport = require("passport");
const helmet = require("helmet");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");

const app = express();

const connectDB = require("./db");
const Room = require("./models/Room");
const authRoutes = require("./routes/auth");
const roomsRoutes = require("./routes/rooms");
const messagesRoutes = require("./routes/messages");
const docsRoutes = require("./routes/docs");
const oauthRoutes = require("./routes/oauth");
const fileRoutes = require("./routes/fileRoutes");
const runCodeRoutes = require("./routes/runCodeRoutes");
const aiRoutes = require("./routes/aiRoutes");

const setupPassport = require("./passport");

setupPassport();

const PORT = process.env.PORT || 3001;
// FIXED: Support both comma-separated URLs AND regex patterns
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173,https://realtime-code-collab-two.vercel.app";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vishal:Vishal2004@cluster0.xrlwwdf.mongodb.net/realtime-collab?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const SESSION_SECRET = process.env.SESSION_SECRET || "session_secret";

// FIXED: Create allowedOrigins array with regex for Vercel preview URLs
const allowedOrigins = [
  ...CLIENT_URL.split(',').map(url => url.trim()).filter(url => url.length > 0),
  /^https:\/\/realtime-code-collab-.*\.vercel\.app$/ // Allow ALL Vercel preview URLs
];
console.log("Allowed Origins for CORS:", allowedOrigins.map(o => o instanceof RegExp ? o.toString() : o));

// FIXED: CORS middleware with regex support
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// 🔍 DEBUG: Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/run", runCodeRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => res.json({ message: "Backend is running" }));

connectDB(MONGO_URI);

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions, // Use same CORS config for Socket.io
  pingTimeout: 60000,
  pingInterval: 25000,
});

const rooms = {};

io.use((socket, next) => {
  console.log("🔐 Auth middleware - Socket:", socket.id, "Token:", socket.handshake.auth?.token ? "Present" : "Missing");
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.user = { id: payload.id, username: payload.username || payload.displayName || payload.email };
      console.log("✅ Token verified for user:", socket.user.username);
    }
  } catch (err) {
    console.log("⚠️ Token verification failed:", err.message);
  }
  next();
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  console.log("📊 Total connections:", io.engine.clientsCount);

  socket.on("join-room", async (payload) => {
    console.log("🚀 JOIN-ROOM EVENT:", payload);
    const { roomId, username, color, user } = payload || {};
    if (!roomId) {
      console.log("❌ No roomId provided");
      return;
    }

    Object.keys(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`⬅️ Left room: ${room}`);
      }
    });

    socket.join(roomId);
    console.log(`✅ Joined room: ${roomId}`);
    
    try {
      let dbRoom = await Room.findOne({ roomId });
      
      if (dbRoom) {
        if (!rooms[roomId]) {
          rooms[roomId] = { 
            users: {}, 
            code: dbRoom.code || "// New room\n",
            language: dbRoom.language || "javascript"
          };
        }
      } else {
        if (!rooms[roomId]) {
          rooms[roomId] = { users: {}, code: "// New room\n", language: "javascript" };
        }
      }
    } catch (err) {
      console.error("Room load error:", err);
      if (!rooms[roomId]) {
        rooms[roomId] = { users: {}, code: "// New room\n", language: "javascript" };
      }
    }

    const finalUsername = username || (user && user.username) || socket.id;
    const finalColor = color || (user && user.color) || "#" + Math.floor(Math.random() * 16777215).toString(16);

    rooms[roomId].users[socket.id] = { id: socket.id, username: finalUsername, color: finalColor };
    console.log(`👤 User added: ${finalUsername} (${socket.id})`);

    socket.to(roomId).emit("receive-message", { 
      senderName: "System", 
      text: `${finalUsername} joined the room`, 
      createdAt: new Date().toISOString() 
    });

    socket.emit("load-code", { 
      code: rooms[roomId].code,
      language: rooms[roomId].language 
    });

    const userList = Object.values(rooms[roomId].users);
    io.in(roomId).emit("users-update", userList);
    console.log(`📢 Sent users-update to room ${roomId}:`, userList.length, "users");
  });

  socket.on("send-message", (data) => {
    console.log("💬 SEND-MESSAGE EVENT:", data);
    const { roomId, message } = data;
    if (!roomId || !message) {
      console.log("❌ Invalid message data");
      return;
    }
    const user = rooms[roomId] && rooms[roomId].users[socket.id];
    const payload = {
      senderName: user ? user.username : "Guest",
      text: message,
      createdAt: new Date().toISOString()
    };
    io.in(roomId).emit("receive-message", payload);
    console.log(`📢 Broadcast message to room ${roomId}`);
  });

  socket.on("code-change", async (data) => {
    console.log("📝 CODE-CHANGE EVENT:", data);
    const { roomId, code } = data;
    if (!roomId || typeof code !== "string") {
      console.log("❌ Invalid code data");
      return;
    }
    if (!rooms[roomId]) rooms[roomId] = { users: {}, code, language: "javascript" };
    rooms[roomId].code = code;
    socket.to(roomId).emit("code-change", { code, sender: socket.id });
    console.log(`📢 Broadcast code to room ${roomId}`);

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { code, updatedAt: Date.now() },
        { upsert: false }
      );
    } catch (err) {
      console.error("Code save error:", err);
    }
  });

  socket.on("language-change", async (data) => {
    const { roomId, language } = data;
    if (!roomId || !language) return;
    
    if (rooms[roomId]) {
      rooms[roomId].language = language;
    }
    
    socket.to(roomId).emit("language-change", { language });

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { language, updatedAt: Date.now() }
      );
    } catch (err) {
      console.error("Language save error:", err);
    }
  });

  socket.on("file-uploaded", async (data) => {
    const { roomId, file } = data;
    if (!roomId || !file) return;
    console.log(`📁 File uploaded in room ${roomId}:`, file.filename);
    socket.to(roomId).emit("file-uploaded", { file });
  });

  socket.on("file-deleted", async (data) => {
    const { roomId, filename } = data;
    if (!roomId || !filename) return;
    console.log(`🗑️ File deleted in room ${roomId}:`, filename);
    socket.to(roomId).emit("file-deleted", { filename });
  });

  socket.on("load-file-to-editor", async (data) => {
    const { roomId, content, language } = data;
    if (!roomId) return;
    socket.to(roomId).emit("load-file-to-editor", { content, language });
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ User disconnected:", socket.id, "Reason:", reason);
    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        const disconnectedUser = rooms[roomId].users[socket.id];
        delete rooms[roomId].users[socket.id];
        console.log(`⬅️ ${disconnectedUser.username} removed from room ${roomId}`);

        socket.to(roomId).emit("receive-message", { 
          senderName: "System", 
          text: `${disconnectedUser.username} left the room`, 
          createdAt: new Date().toISOString() 
        });
        
        const userList = Object.values(rooms[roomId].users);
        io.in(roomId).emit("users-update", userList);
        console.log(`📢 Sent users-update after disconnect`);

        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
          console.log(`🗑️ Room ${roomId} deleted (empty)`);
        }
      }
    }
  });
});

const wss = new WebSocket.Server({ noServer: true });
server.on("upgrade", (request, socket, head) => {
  const { url } = request;
  if (url && url.startsWith("/yjs")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      setupWSConnection(ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Socket.io server initialized`);
});