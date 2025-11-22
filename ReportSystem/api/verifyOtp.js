// api/verifyOtp.js
import OTP from '../models/OTP'; // Import the OTP model
import bcrypt from 'bcryptjs';
import connectToDatabase from '../utils/db'; // Import the MongoDB connection utility
import dotenv from 'dotenv';

dotenv.config();

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Only POST requests are allowed' });

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and code required' });
  }

  try {
    // Ensure the database is connected before performing any database operations
    await connectToDatabase();

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    }

    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'OTP invalid' });
    }

    await OTP.deleteOne({ email });
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};
