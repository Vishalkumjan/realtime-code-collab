// server/routes/fileRoutes.js - CREATE NEW FILE
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// 📤 Upload File
router.post("/upload", async (req, res) => {
  try {
    const { roomId, filename, content, language, uploadedBy } = req.body;

    // Validation
    if (!roomId || !filename || !content || !uploadedBy) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // File size check (5MB = 5 * 1024 * 1024 bytes)
    const size = Buffer.byteLength(content, "utf8");
    const MAX_SIZE = 5 * 1024 * 1024;
    
    if (size > MAX_SIZE) {
      return res.status(400).json({ 
        success: false, 
        message: "File size exceeds 5MB limit" 
      });
    }

    // Find or create room
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = new Room({ roomId, code: content, language: language || "javascript" });
    }

    // Check if file already exists
    const existingFileIndex = room.files.findIndex(f => f.filename === filename);
    
    const fileData = {
      filename,
      content,
      language: language || "javascript",
      size,
      uploadedBy,
      uploadedAt: new Date(),
    };

    if (existingFileIndex > -1) {
      // Replace existing file
      room.files[existingFileIndex] = fileData;
    } else {
      // Add new file
      room.files.push(fileData);
    }

    room.updatedAt = Date.now();
    await room.save();

    res.json({ 
      success: true, 
      message: "File uploaded successfully",
      file: fileData
    });

  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during file upload" 
    });
  }
});

// 📥 Get All Files in Room
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.json({ success: true, files: [] });
    }

    res.json({ 
      success: true, 
      files: room.files || [] 
    });

  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// 🗑️ Delete File
router.delete("/:roomId/:filename", async (req, res) => {
  try {
    const { roomId, filename } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: "Room not found" 
      });
    }

    room.files = room.files.filter(f => f.filename !== filename);
    room.updatedAt = Date.now();
    await room.save();

    res.json({ 
      success: true, 
      message: "File deleted successfully" 
    });

  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;