
import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('Email credentials not set in environment variables');
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Generate verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: EMAIL_USER,
      to,
      subject: 'Anime Character Chat - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #fff; border-radius: 10px;">
          <h1 style="color: #a855f7; text-align: center;">Anime Character Chat</h1>
          <h2 style="text-align: center;">Email Verification</h2>
          <p>Thank you for joining Anime Character Chat! To complete your registration, please use the verification code below:</p>
          <div style="background-color: #2d2d2d; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="color: #a855f7; letter-spacing: 5px; margin: 0;">${code}</h2>
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <div style="text-align: center; margin-top: 30px; color: #737373;">
            <p>© 2025 Anime Character Chat. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}
