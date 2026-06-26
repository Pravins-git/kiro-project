import { Router } from 'express';

import { CognitoController } from '../../api/controllers/Cognito.controller.js';
import { authRateLimiter } from '../../shared/middleware/rate-limit.js';

export const cognitoRouter = Router();

// Apply rate limiting to all Cognito auth endpoints
const cognitoRateLimit = authRateLimiter();

cognitoRouter.post('/register', cognitoRateLimit, CognitoController.register);
cognitoRouter.post('/login', cognitoRateLimit, CognitoController.login);
cognitoRouter.post('/confirm', cognitoRateLimit, CognitoController.confirm);
cognitoRouter.post('/forgot-password', cognitoRateLimit, CognitoController.forgotPassword);
cognitoRouter.post('/confirm-password', cognitoRateLimit, CognitoController.confirmPassword);
cognitoRouter.post('/refresh', cognitoRateLimit, CognitoController.refresh);
cognitoRouter.get('/user', CognitoController.getUser);
cognitoRouter.post('/mfa/setup', cognitoRateLimit, CognitoController.mfaSetup);
cognitoRouter.post('/mfa/verify', cognitoRateLimit, CognitoController.mfaVerify);
