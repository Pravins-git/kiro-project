import { Router } from 'express';

import { getCareerMatches } from '../../api/controllers/CareerMatches.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

export const careerMatchesRouter = Router();

careerMatchesRouter.use(authenticate as any);

careerMatchesRouter.get('/', getCareerMatches as any);
