import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Clean the connection string to remove any BOM or encoding issues
    let mongoUri = process.env.MONGO_URI || '';
    // Remove BOM characters and other encoding artifacts
    mongoUri = mongoUri.replace(/^\?o/g, '').replace(/\?\?$/g, '').trim();
    
    // Ensure it starts with mongodb:// or mongodb+srv://
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB connection string format');
    }
    
    const conn = await mongoose.connect(mongoUri); //, { useNewUrlParser: true, useUnifiedTopology: true,}

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
