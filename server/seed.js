// server/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/realtime-collab";

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to Mongo for seeding");

  const username = "testuser";
  const password = "password123";
  const existing = await User.findOne({ username });
  if (existing) {
    console.log("User already exists:", username);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash });
  await user.save();
  console.log("Seed user created:", username, "password:", password);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
