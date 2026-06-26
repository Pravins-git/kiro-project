import { Router } from 'express';
import { AdminController } from '../../api/controllers/Admin.controller.js';
import { authSelector, authorize } from '../../shared/middleware/auth.middleware.js';

export const adminRouter = Router();

// Protect all admin routes and ensure user is a Platform Admin
adminRouter.use(authSelector as any);
adminRouter.use(authorize(['Platform Admin']) as any);

adminRouter.get('/metrics', AdminController.getMetrics as any);
adminRouter.get('/users', AdminController.getUsers as any);
adminRouter.delete('/users/:id', AdminController.deleteUser as any);
