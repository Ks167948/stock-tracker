const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Railway uses MONGO_URL, local uses MONGO_URI — check both
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.MONGODB_URL ||
      process.env.DATABASE_URL;

    if (!uri) {
      throw new Error('No MongoDB connection string found in environment variables');
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;