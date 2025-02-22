import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { User } from '../models/User';
import crypto from 'crypto';

export class VerificationService {
  private static emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  private static twilioClient = process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public static async sendEmailVerification(userId: string, email: string): Promise<void> {
    const token = this.generateToken();
    const verificationLink = `${process.env.CLIENT_URL}/verify/email/${token}`;

    await User.findByIdAndUpdate(userId, {
      emailVerificationToken: token
    });

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your email address',
      html: `
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      `
    });
  }

  public static async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      throw new Error('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  public static async resendEmailVerification(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.sendEmailVerification(userId, user.email);
  }

  public static async sendPhoneVerification(userId: string, phone: string): Promise<void> {
    const code = this.generateVerificationCode();

    await User.findByIdAndUpdate(userId, {
      phoneVerificationCode: code
    });

    if (!this.twilioClient) {
      throw new Error('Twilio client not configured');
    }

    await this.twilioClient.messages.create({
      body: `Your verification code is: ${code}`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
  }

  public static async verifyPhone(userId: string, code: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user || user.phoneVerificationCode !== code) {
      throw new Error('Invalid verification code');
    }

    user.phoneVerified = true;
    user.phoneVerificationCode = undefined;
    await user.save();
  }

  public static async resendPhoneVerification(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.phone) {
      throw new Error('No phone number found');
    }

    await this.sendPhoneVerification(userId, user.phone);
  }
}
