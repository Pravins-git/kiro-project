import { Router } from 'express';

import { generateRoadmap, getRoadmap } from '../../api/controllers/Roadmap.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';

export const roadmapsRouter = Router();

roadmapsRouter.use(authenticate as any);

roadmapsRouter.post('/generate', generateRoadmap as any);
roadmapsRouter.get('/:careerId', getRoadmap as any);
