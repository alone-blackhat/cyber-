import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn("⚠️ MONGODB_URI is not defined in environment variables. Falling back to secure in-memory local user datastore for preview safety.");
    return false;
  }

  try {
    // Set connection timeouts so it fails fast if offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("🔌 MongoDB Connected Successfully.");
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Failure:", error);
    console.warn("⚠️ System falling back to secure in-memory local user datastore to prevent server crash.");
    return false;
  }
}

export function getIsConnected(): boolean {
  return isConnected;
}
