// models/OTP.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
export default OTP;
