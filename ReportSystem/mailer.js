import nodemailer from "nodemailer";

export function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendOtp({ to, code }) {
  const t = transporter();
  await t.verify();

  const ttl = Number(process.env.OTP_TTL_MINUTES || 10);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <h2>Email Verification</h2>
      <p>Your one time code is:</p>
      <p style="font-size:26px;letter-spacing:4px;margin:12px 0"><b>${code}</b></p>
      <p>This code will expire in ${ttl} minutes.</p>
      <p style="color:#666;font-size:12px">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  return t.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: "Your verification code",
    html
  });
}
