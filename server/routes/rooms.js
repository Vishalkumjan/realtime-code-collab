// backend/server/routes/rooms.js
const express = require("express");
const Room = require("../models/Room");
const Doc = require("../models/Doc");
const authMiddleware = require("../middleware/auth");
const bcrypt = require("bcrypt");

const router = express.Router();

// Create or get doc by roomId (existing functionality)
router.post("/", async (req, res) => {
  try {
    const roomId = req.body.roomId;
    if (!roomId) return res.status(400).json({ message: "roomId required" });
    let doc = await Doc.findOne({ roomId });
    if (!doc) {
      doc = await Doc.create({ roomId, content: req.body.content || "" });
    }
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

// Get doc by roomId (existing functionality)
router.get("/:roomId", async (req, res) => {
  try {
    const doc = await Doc.findOne({ roomId: req.params.roomId });
    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

// Create new room
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { roomId, name, isPublic, password, language } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ message: "Room ID required" });
    }

    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(400).json({ message: "Room ID already exists" });
    }

    const roomData = {
      roomId,
      name: name || roomId,
      owner: req.user.id,
      isPublic: isPublic !== false,
      language: language || "javascript",
      members: [req.user.id]
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      roomData.password = hashedPassword;
    }

    const room = await Room.create(roomData);
    res.json({ room });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get room info
router.get("/info/:roomId", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("owner", "displayName email")
      .populate("members", "displayName email");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ room });
  } catch (err) {
    console.error("Get room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Join room
router.post("/:roomId/join", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isPublic && room.password) {
      if (!password) {
        return res.status(401).json({ message: "Password required", requiresPassword: true });
      }

      const validPassword = await bcrypt.compare(password, room.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }

    res.json({ 
      success: true, 
      room: {
        roomId: room.roomId,
        name: room.name,
        language: room.language,
        code: room.code
      }
    });
  } catch (err) {
    console.error("Join room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's rooms
router.get("/user/my-rooms", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ 
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    })
    .populate("owner", "displayName")
    .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (err) {
    console.error("Get user rooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update room code
router.put("/:roomId/code", async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.code = code;
    await room.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Update code error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete room
router.delete("/:roomId", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can delete room" });
    }

    await Room.deleteOne({ roomId: req.params.roomId });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;