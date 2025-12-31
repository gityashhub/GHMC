import authService from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */

class AuthController {
  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      logger.info(`User logged in: ${result.user.email}`);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = req.user;

      res.status(200).json({
        success: true,
        data: { user },
        message: 'User retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.userId;
      const updateData = req.body;

      const updatedUser = await authService.updateProfile(userId, updateData);

      logger.info(`User profile updated: ${updatedUser.email}`);

      res.status(200).json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/auth/password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      logger.info(`Password changed for user: ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token removal)
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      // Since we're using JWT, logout is handled client-side by removing the token
      // This endpoint just confirms the logout
      logger.info(`User logged out: ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

