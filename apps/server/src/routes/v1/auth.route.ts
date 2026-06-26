import { Router } from 'express';

import { AuthController } from '../../api/controllers/Auth.controller.js';
import { authRateLimiter } from '../../shared/middleware/rate-limit.js';

export const authRouter = Router();

const authRateLimit = authRateLimiter();

authRouter.post('/register', authRateLimit, AuthController.register);
authRouter.post('/login', authRateLimit, AuthController.login);
authRouter.post('/google', AuthController.googleLogin);
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);
authRouter.post('/verify-email', AuthController.verifyEmail);
authRouter.post('/mfa/enable', AuthController.enableMfa);
authRouter.post('/mfa/verify', AuthController.verifyMfa);
