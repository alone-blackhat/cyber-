import mongoose, { Schema, Document } from "mongoose";
import fs from "fs";
import path from "path";
import { getIsConnected } from "../config/db.ts";

// --- USER INTERFACE ---
export interface IUser {
  username: string;
  email: string;
  password_hash?: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
  provider?: string;
  providerId?: string;
  profilePhoto?: string;
}

export interface IUserDocument extends IUser, Document {}

// --- MONGOOSE SCHEMA ---
const UserSchema = new Schema<IUserDocument>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password_hash: { type: String, required: false },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  provider: { type: String },
  providerId: { type: String },
  profilePhoto: { type: String }
});

export const MongoUserModel: mongoose.Model<IUserDocument> = 
  (mongoose.models.User as any) || 
  mongoose.model<IUserDocument>("User", UserSchema);

// --- FALLBACK LOCAL PERSISTENT FILE DATABASE ---
const FALLBACK_FILE_PATH = path.join(process.cwd(), "data", "users.json");

// Ensure the directory exists
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Read fallback users
function readFallbackUsers(): IUser[] {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    if (!fs.existsSync(FALLBACK_FILE_PATH)) {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading local user fallback db:", error);
    return [];
  }
}

// Write fallback users
function writeFallbackUsers(users: IUser[]) {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error writing local user fallback db:", error);
  }
}

// --- UNIFIED USER SERVICE MANAGER ---
export const UserService = {
  async findByProvider(provider: string, providerId: string): Promise<IUser | null> {
    if (getIsConnected()) {
      return await MongoUserModel.findOne({ provider, providerId }).lean();
    } else {
      const users = readFallbackUsers();
      return users.find(u => u.provider === provider && u.providerId === providerId) || null;
    }
  },

  async linkProvider(email: string, provider: string, providerId: string, profilePhoto?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();
    if (getIsConnected()) {
      await MongoUserModel.updateOne(
        { email: normalizedEmail },
        { provider, providerId, profilePhoto, lastLogin: now }
      );
    } else {
      const users = readFallbackUsers();
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (user) {
        user.provider = provider;
        user.providerId = providerId;
        user.profilePhoto = profilePhoto;
        user.lastLogin = now;
        writeFallbackUsers(users);
      }
    }
  },

  async findByEmail(email: string): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    if (getIsConnected()) {
      return await MongoUserModel.findOne({ email: normalizedEmail }).lean();
    } else {
      const users = readFallbackUsers();
      return users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
    }
  },

  async findByUsername(username: string): Promise<IUser | null> {
    const normalizedUsername = username.trim();
    if (getIsConnected()) {
      return await MongoUserModel.findOne({ username: { $regex: new RegExp(`^${normalizedUsername}$`, "i") } }).lean();
    } else {
      const users = readFallbackUsers();
      return users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase()) || null;
    }
  },

  async findByUsernameOrEmail(identifier: string): Promise<IUser | null> {
    const searchVal = identifier.trim().toLowerCase();
    if (getIsConnected()) {
      return await MongoUserModel.findOne({
        $or: [
          { email: searchVal },
          { username: { $regex: new RegExp(`^${searchVal}$`, "i") } }
        ]
      }).lean();
    } else {
      const users = readFallbackUsers();
      return users.find(u => 
        u.email.toLowerCase() === searchVal || 
        u.username.toLowerCase() === searchVal
      ) || null;
    }
  },

  async createUser(userData: Omit<IUser, "createdAt">): Promise<IUser> {
    const newUser: IUser = {
      ...userData,
      email: userData.email.toLowerCase().trim(),
      username: userData.username.trim(),
      createdAt: new Date()
    };

    if (getIsConnected()) {
      const dbUser = new MongoUserModel(newUser);
      const saved = await dbUser.save();
      return saved.toObject();
    } else {
      const users = readFallbackUsers();
      users.push(newUser);
      writeFallbackUsers(users);
      return newUser;
    }
  },

  async updateLastLogin(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();
    if (getIsConnected()) {
      await MongoUserModel.updateOne({ email: normalizedEmail }, { lastLogin: now });
    } else {
      const users = readFallbackUsers();
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (user) {
        user.lastLogin = now;
        writeFallbackUsers(users);
      }
    }
  }
};
