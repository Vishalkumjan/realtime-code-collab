// server/models/Room.js - COMPLETE UPDATED VERSION
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: "Untitled Room" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  code: { type: String, default: "// Start coding...\n" },
  language: { type: String, default: "javascript" },
  isPublic: { type: Boolean, default: true },
  password: { type: String, default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // 🆕 NEW: Files array for upload/download feature
  files: [
    {
      filename: { type: String, required: true },
      content: { type: String, required: true },
      language: { type: String, default: "javascript" },
      size: { type: Number, required: true }, // in bytes
      uploadedBy: { type: String, required: true }, // username
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Room", roomSchema);