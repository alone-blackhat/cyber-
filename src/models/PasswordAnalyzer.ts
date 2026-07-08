import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordAnalysis extends Document {
  username: string;
  passwordLength: number;
  entropy: number;
  strengthLabel: string;
  complexityScore: number;
  breachCount: number;
  checksPassed: number;
  checksFailed: number;
  timestamp: Date;
  lookupStatus: string;
}

const PasswordAnalysisSchema: Schema = new Schema({
  username: { type: String, required: true },
  passwordLength: { type: Number, required: true },
  entropy: { type: Number, required: true },
  strengthLabel: { type: String, required: true },
  complexityScore: { type: Number, required: true },
  breachCount: { type: Number, default: 0 },
  checksPassed: { type: Number, default: 0 },
  checksFailed: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  lookupStatus: { type: String, default: "success" }
});

export const PasswordAnalysis = mongoose.model<IPasswordAnalysis>("PasswordAnalysis", PasswordAnalysisSchema);
