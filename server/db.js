const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/realtime-collab";

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
