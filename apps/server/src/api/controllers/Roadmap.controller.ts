import { Request, Response, NextFunction } from 'express';

import { RoadmapService } from '../services/Roadmap.service.js';

const roadmapService = new RoadmapService();

export const generateRoadmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { targetCareerId, targetCareerTitle } = req.body;
    if (!targetCareerId || !targetCareerTitle) {
      res.status(400).json({ message: 'Missing career target parameters' });
      return;
    }

    // Check if roadmap already exists
    const existing = await roadmapService.getRoadmap(userId, targetCareerId);
    if (existing) {
      res.status(200).json({ data: existing });
      return;
    }

    const response = await roadmapService.generateRoadmap(userId, targetCareerId, targetCareerTitle);
    res.status(200).json({ data: response });
  } catch (error) {
    next(error);
  }
};

export const getRoadmap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const targetCareerId = req.params.careerId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const response = await roadmapService.getRoadmap(userId, targetCareerId);
    if (!response) {
      res.status(404).json({ message: 'Roadmap not found' });
      return;
    }

    res.status(200).json({ data: response });
  } catch (error) {
    next(error);
  }
};
