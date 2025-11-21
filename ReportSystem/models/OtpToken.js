import mongoose from "mongoose";

const OtpTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 }
});

// Optional TTL index using expiresAt
// OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken = mongoose.model("OtpToken", OtpTokenSchema);
