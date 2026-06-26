import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RegisterRequest, LoginRequest, UserProfile, GoogleLoginRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, VerifyMfaRequest } from '@ai-career/shared';

import { config } from '../../config/index.js';
import { User } from '../models/User.model.js';

export class AuthService {
  static async register(data: RegisterRequest) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new User({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    await user.save();

    return {
      userId: user._id.toString(),
      message: 'Registration successful',
      verificationEmailSent: false,
    };
  }

  static async login(data: LoginRequest) {
    const user = await User.findOne({ email: data.email });
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwtSecret as string, {
      expiresIn: config.jwtExpiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwtSecret as string, {
      expiresIn: config.refreshTokenExpiresIn as any,
    });

    const userProfile: UserProfile = {
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any,
      profileCompleteness: user.profileCompleteness,
      createdAt: (user as any).createdAt?.toISOString() || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: user.mfaEnabled,
      notificationPreferences: {
        careerUpdates: true,
        learningReminders: true,
        interviewReminders: true,
        roadmapUpdates: true,
        systemAnnouncements: true,
      },
      version: user.version,
    };

    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }

  static async googleLogin(data: GoogleLoginRequest) {
    // In a real scenario, we would verify the idToken using google-auth-library
    // For this implementation, we will decode it (or mock it)
    const mockEmail = `googleuser_${crypto.randomBytes(4).toString('hex')}@example.com`;
    let user = await User.findOne({ googleId: data.idToken });
    
    if (!user) {
      user = new User({
        email: mockEmail,
        firstName: 'Google',
        lastName: 'User',
        googleId: data.idToken,
        isVerified: true,
      });
      await user.save();
    }

    return this.login({ email: user.email, password: '' });
  }

  static async forgotPassword(data: ForgotPasswordRequest) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Here we would normally send the email via an email service
    return { message: 'If an account exists, a reset link has been sent.' };
  }

  static async resetPassword(data: ResetPasswordRequest) {
    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error('Token is invalid or has expired');
    }

    user.password = await bcrypt.hash(data.newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  static async verifyEmail(data: VerifyEmailRequest) {
    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashedToken });

    if (!user) {
      throw new Error('Token is invalid');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  static async enableMfa(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // In a real enterprise app, we'd use 'speakeasy' and 'qrcode'
    const secret = crypto.randomBytes(20).toString('hex');
    user.mfaSecret = secret;
    user.mfaEnabled = true;
    await user.save();

    return { secret, qrCodeUrl: `otpauth://totp/KiroApp:${user.email}?secret=${secret}&issuer=KiroApp` };
  }

  static async verifyMfa(data: VerifyMfaRequest) {
    const user = await User.findById(data.userId);
    if (!user) throw new Error('User not found');
    
    // In a real enterprise app, we'd use speakeasy.totp.verify
    const isValid = data.token === '000000'; // mock verification for testing
    if (!isValid) throw new Error('Invalid MFA token');

    return { message: 'MFA verified successfully' };
  }
}
