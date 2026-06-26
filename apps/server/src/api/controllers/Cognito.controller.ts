import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { cognitoService } from '../services/aws/Cognito.service.js';

// Zod schemas for input validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const confirmSchema = z.object({
  email: z.string().email('Invalid email address'),
  confirmationCode: z.string().min(1, 'Confirmation code is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const confirmPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  confirmationCode: z.string().min(1, 'Confirmation code is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const mfaSetupSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
});

const mfaVerifySchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  totpCode: z.string().min(6, 'TOTP code must be at least 6 characters'),
  friendlyDeviceName: z.string().optional(),
});

export class CognitoController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await cognitoService.signUp(data);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful. Please check your email for confirmation code.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const tokens = await cognitoService.signIn(data);
      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const data = confirmSchema.parse(req.body);
      await cognitoService.confirmSignUp(data.email, data.confirmationCode);
      res.status(200).json({
        success: true,
        message: 'Email confirmed successfully. You can now sign in.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const result = await cognitoService.forgotPassword(data.email);
      res.status(200).json({
        success: true,
        data: result,
        message: 'If the email exists, a password reset code has been sent.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async confirmPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = confirmPasswordSchema.parse(req.body);
      await cognitoService.confirmForgotPassword(data.email, data.confirmationCode, data.newPassword);
      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now sign in with your new password.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = refreshSchema.parse(req.body);
      const tokens = await cognitoService.refreshToken(data.refreshToken);
      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Bearer token required' } });
        return;
      }
      const accessToken = authHeader.split(' ')[1];
      const userInfo = await cognitoService.getUser(accessToken);
      res.status(200).json({
        success: true,
        data: userInfo,
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async mfaSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const data = mfaSetupSchema.parse(req.body);
      const result = await cognitoService.setupMFA(data.accessToken);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Scan the QR code with your authenticator app.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }

  static async mfaVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const data = mfaVerifySchema.parse(req.body);
      await cognitoService.verifyMFA(data.accessToken, data.totpCode, data.friendlyDeviceName);
      res.status(200).json({
        success: true,
        message: 'MFA enabled successfully.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
        return;
      }
      next(error);
    }
  }
}
