// backend/server/models/Doc.js
const mongoose = require("mongoose");

const docSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    content: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Doc", docSchema);
