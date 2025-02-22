import { User } from '../models/User';
import { Types } from 'mongoose';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

// Initialize Twilio client only if credentials are valid
if (accountSid?.startsWith('AC') && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✓ Twilio client configured');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Twilio client:', error);
    client = null;
  }
} else {
  console.warn('⚠️  Twilio credentials not configured - SMS features will be disabled');
}

export class VerificationService {
  static async sendEmailVerification(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate verification token
      const token = Math.random().toString(36).substring(2, 15);
      user.verificationToken = token;
      await user.save();

      // TODO: Implement email sending
      console.log('Email verification token:', token);
    } catch (error) {
      console.error('Send email verification error:', error);
      throw error;
    }
  }

  static async verifyEmail(userId: string, token: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || user.verificationToken !== token) {
        return false;
      }

      user.emailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      return true;
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  static async sendPhoneVerification(userId: string, phone: string): Promise<void> {
    try {
      if (!client || !twilioPhoneNumber) {
        throw new Error('SMS service not configured');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate verification code
      const code = Math.random().toString().substring(2, 8);
      user.phoneVerificationToken = code;
      user.phone = phone;
      await user.save();

      try {
        // Send SMS
        await client.messages.create({
          body: `Your verification code is: ${code}`,
          to: phone,
          from: twilioPhoneNumber
        });
        console.log('SMS sent successfully to:', phone);
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
        // Reset verification token if SMS fails
        user.phoneVerificationToken = undefined;
        await user.save();
        throw new Error('Failed to send verification SMS');
      }
    } catch (error) {
      console.error('Send phone verification error:', error);
      throw error;
    }
  }

  static async verifyPhone(userId: string, code: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || user.phoneVerificationToken !== code) {
        return false;
      }

      user.phoneVerified = true;
      user.phoneVerificationToken = undefined;
      await user.save();

      return true;
    } catch (error) {
      console.error('Verify phone error:', error);
      throw error;
    }
  }

  static async getVerificationStatus(userId: Types.ObjectId): Promise<{
    emailVerified: boolean;
    phoneVerified: boolean;
    smsEnabled: boolean;
  }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        smsEnabled: !!client && !!twilioPhoneNumber
      };
    } catch (error) {
      console.error('Get verification status error:', error);
      throw error;
    }
  }
}
