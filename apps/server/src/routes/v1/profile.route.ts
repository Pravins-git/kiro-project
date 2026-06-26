import { Router } from 'express';

import { ProfileController } from '../../api/controllers/Profile.controller.js';
import { authSelector } from '../../shared/middleware/auth.middleware.js';

export const profileRouter = Router();

profileRouter.use(authSelector as any);

profileRouter.get('/', ProfileController.getProfile);
profileRouter.put('/', ProfileController.updateProfile);
