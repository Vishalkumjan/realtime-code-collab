// backend/server/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderName: { type: String },
    senderId: { type: String },
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Message", messageSchema);
