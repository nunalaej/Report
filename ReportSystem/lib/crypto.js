import bcrypt from "bcryptjs";

export function generateOtp(length = 6) {
  // 6-digit numeric code
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n).slice(0, length);
}

export async function hash(value) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(value, salt);
}

export async function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}
