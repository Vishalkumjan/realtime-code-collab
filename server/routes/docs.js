// server/routes/docs.js
const express = require("express");
const Doc = require("../models/Doc");

const router = express.Router();

// GET /api/docs/:roomId
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const doc = await Doc.findOne({ roomId });
    if (!doc) return res.status(404).json({ message: "doc not found" });
    return res.json(doc);
  } catch (err) {
    console.error("get doc error:", err);
    return res.status(500).json({ message: "server error" });
  }
});

// POST /api/docs/:roomId  -> create/update snapshot
router.post("/save", async (req, res) => {
  try {
    const { roomId, content } = req.body;
    if (!roomId) return res.status(400).json({ message: "roomId required" });
    const doc = await Doc.findOneAndUpdate({ roomId }, { content, updatedAt: Date.now() }, { upsert: true, new: true });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
