// server/routes/messages.js
const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// GET /api/rooms/:roomId/messages?limit=50
router.get("/:roomId", async (req, res) => {
  try {
    const msgs = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 }).limit(200);
    res.json(msgs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

// POST /api/rooms/:roomId/messages
router.post("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { senderId = null, senderName, text } = req.body || {};
    if (!senderName || !text) return res.status(400).json({ message: "senderName and text required" });

    const msg = new Message({ roomId, senderId, senderName, text });
    await msg.save();
    return res.status(201).json(msg);
  } catch (err) {
    console.error("post message error:", err);
    return res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
