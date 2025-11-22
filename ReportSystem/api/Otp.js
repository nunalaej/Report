// api/otp.js
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import OTP from '../models/OTP';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendOTP(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  if (!email.endsWith('@dlsud.edu.ph')) {
    return res.status(400).json({
      success: false,
      message: 'Only @dlsud.edu.ph emails are allowed',
    });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { codeHash, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Your OTP Code',
      html: `<h2>Your Verification Code</h2><h1>${code}</h1><p>Valid for ${ttlMinutes} minutes.</p>`,
    });

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

export async function verifyOTP(req, res) {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and code required' });
  }

  try {
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
}
