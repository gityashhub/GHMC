import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, loginSchema, updateProfileSchema, changePasswordSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Authentication Routes
 * 
 * POST   /api/auth/login      - Login admin user
 * GET    /api/auth/me         - Get current user (protected)
 * PUT    /api/auth/profile    - Update profile (protected)
 * PUT    /api/auth/password   - Change password (protected)
 * POST   /api/auth/logout     - Logout (protected)
 */

// Public routes
router.post('/login', validate(loginSchema), authController.login.bind(authController));

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getMe.bind(authController));
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile.bind(authController));
router.put('/password', authenticate, validate(changePasswordSchema), authController.changePassword.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));

export default router;

