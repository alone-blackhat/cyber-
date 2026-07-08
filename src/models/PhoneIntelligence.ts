import mongoose, { Schema, Document } from "mongoose";
import fs from "fs";
import path from "path";
import { getIsConnected } from "../config/db.ts";

export interface IPhoneLookup {
  phoneNumber: string;
  timestamp: Date;
  lookupStatus: string; // 'SUCCESS' or 'FAILED'
  country: string;
  carrier: string;
  lineType: string;
  valid: boolean;
  internationalFormat: string;
  nationalFormat: string;
  countryCode: string;
  region: string;
  timeZone: string;
  spamScore: number;
}

export interface IPhoneLookupDocument extends IPhoneLookup, Document {}

const PhoneLookupSchema = new Schema<IPhoneLookupDocument>({
  phoneNumber: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  lookupStatus: { type: String, required: true },
  country: { type: String, default: "Unknown" },
  carrier: { type: String, default: "Unknown" },
  lineType: { type: String, default: "Unknown" },
  valid: { type: Boolean, default: false },
  internationalFormat: { type: String, default: "" },
  nationalFormat: { type: String, default: "" },
  countryCode: { type: String, default: "" },
  region: { type: String, default: "" },
  timeZone: { type: String, default: "" },
  spamScore: { type: Number, default: 0 }
});

export const MongoPhoneLookupModel: mongoose.Model<IPhoneLookupDocument> =
  (mongoose.models.PhoneLookup as any) ||
  mongoose.model<IPhoneLookupDocument>("PhoneLookup", PhoneLookupSchema);

// --- FALLBACK LOCAL FILE PERSISTENCE ---
const FALLBACK_FILE_PATH = path.join(process.cwd(), "data", "phone_lookups.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function readFallbackLookups(): IPhoneLookup[] {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    if (!fs.existsSync(FALLBACK_FILE_PATH)) {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading phone fallback lookups db:", error);
    return [];
  }
}

function writeFallbackLookups(lookups: IPhoneLookup[]) {
  try {
    ensureDirectoryExistence(FALLBACK_FILE_PATH);
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(lookups, null, 2));
  } catch (error) {
    console.error("Error writing phone fallback lookups db:", error);
  }
}

export const PhoneLookupService = {
  async saveLookup(lookup: IPhoneLookup): Promise<IPhoneLookup> {
    if (getIsConnected()) {
      const doc = new MongoPhoneLookupModel(lookup);
      const saved = await doc.save();
      return saved.toObject() as IPhoneLookup;
    } else {
      const lookups = readFallbackLookups();
      lookups.unshift(lookup); // Keep newest at top
      // Cap fallback lookups at 100 for safety
      if (lookups.length > 100) {
        lookups.pop();
      }
      writeFallbackLookups(lookups);
      return lookup;
    }
  },

  async getHistory(): Promise<IPhoneLookup[]> {
    if (getIsConnected()) {
      return await MongoPhoneLookupModel.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean() as unknown as IPhoneLookup[];
    } else {
      return readFallbackLookups().slice(0, 20);
    }
  },

  async clearHistory(): Promise<void> {
    if (getIsConnected()) {
      await MongoPhoneLookupModel.deleteMany({});
    } else {
      writeFallbackLookups([]);
    }
  }
};
