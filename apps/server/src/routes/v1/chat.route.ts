import { Router } from 'express';

import { sendMessage } from '../../api/controllers/Chat.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

export const chatRouter = Router();

chatRouter.use(authenticate as any);

chatRouter.post('/', sendMessage as any);
