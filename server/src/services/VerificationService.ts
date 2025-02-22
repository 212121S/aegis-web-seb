import nodemailer from 'nodemailer';
import twilio from 'twilio';
import crypto from 'crypto';
import { User } from '../models/User';

// Initialize email transporter if credentials are available
const emailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
  ? nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  : null;

// Initialize Twilio client if credentials are available
const twilioClient: twilio.Twilio | null = null; // Disabled for testing

export class VerificationService {
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendEmailVerification(userId: string, email: string): Promise<void> {
    try {
      const token = this.generateToken();
      
      // Update user with verification token
      await User.findByIdAndUpdate(userId, {
        emailVerificationToken: token,
        emailVerified: false
      });

      // Skip email sending in test mode
      if (emailTransporter) {
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${token}`;
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Verify Your Email Address',
          html: `
            <h1>Email Verification</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationLink}">${verificationLink}</a>
            <p>This link will expire in 24 hours.</p>
          `
        });
      } else {
        console.log('Test mode: Email would be sent with token:', token);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    try {
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        throw new Error('Invalid verification token');
      }

      user.emailVerified = true;
      user.emailVerificationToken = '';
      await user.save();
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error('Failed to verify email');
    }
  }

  static async sendPhoneVerification(userId: string, phone: string): Promise<void> {
    try {
      const code = this.generateCode();
      
      // Update user with verification code
      await User.findByIdAndUpdate(userId, {
        phoneVerificationCode: code,
        phoneVerified: false
      });

      // Send verification SMS
      // Skip SMS sending in test mode
      if (twilioClient) {
        await twilioClient.messages.create({
          body: `Your Aegis verification code is: ${code}`,
          to: phone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      } else {
        console.log('Test mode: SMS would be sent with code:', code);
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      throw new Error('Failed to send verification SMS');
    }
  }

  static async verifyPhone(userId: string, code: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user || user.phoneVerificationCode !== code) {
        throw new Error('Invalid verification code');
      }

      user.phoneVerified = true;
      user.phoneVerificationCode = '';
      await user.save();
    } catch (error) {
      console.error('Phone verification error:', error);
      throw new Error('Failed to verify phone');
    }
  }

  static async resendEmailVerification(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await this.sendEmailVerification(userId, user.email);
    } catch (error) {
      console.error('Resend email verification error:', error);
      throw new Error('Failed to resend verification email');
    }
  }

  static async resendPhoneVerification(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await this.sendPhoneVerification(userId, user.phone);
    } catch (error) {
      console.error('Resend phone verification error:', error);
      throw new Error('Failed to resend verification SMS');
    }
  }
}
