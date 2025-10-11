// server/seed_db.js
require("dotenv").config();
const connectDB = require("./db");
const Room = require("./models/Room");
const Message = require("./models/Message");
const Doc = require("./models/Doc");
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/realtime-collab";

async function run() {
  await connectDB(MONGO_URI);

  // create sample room
  const roomId = "room1";
  const existing = await Room.findOne({ roomId });
  if (!existing) {
    await new Room({ roomId, name: "Sample Room 1" }).save();
    console.log("Room created:", roomId);
  } else {
    console.log("Room exists:", roomId);
  }

  // create sample doc
  await Doc.findOneAndUpdate(
    { roomId },
    { content: "// Sample saved document\nconsole.log('Hello from DB');", updatedAt: new Date() },
    { upsert: true }
  );
  console.log("Doc seeded for:", roomId);

  // create sample messages
  await Message.create([
    { roomId, senderName: "Alice", text: "Welcome to room1" },
    { roomId, senderName: "Bob", text: "Hi Alice!" }
  ]);
  console.log("Sample messages created.");

  mongoose.connection.close();
  console.log("Seeding finished.");
}

run().catch(err => { console.error(err); process.exit(1); });
