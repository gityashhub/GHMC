import settingsService from '../services/settings.service.js';
import { logger } from '../utils/logger.js';

/**
 * Settings Controller
 * Handles HTTP requests for settings operations
 */

class SettingsController {
  /**
   * Get all settings
   * GET /api/settings
   */
  async getAllSettings(req, res, next) {
    try {
      const settings = await settingsService.getAllSettings();

      res.json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      logger.error('Error fetching settings:', error);
      next(error);
    }
  }

  /**
   * Get setting by key
   * GET /api/settings/:key
   */
  async getSettingByKey(req, res, next) {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSettingByKey(key);

      res.json({
        success: true,
        data: { setting },
      });
    } catch (error) {
      logger.error('Error fetching setting:', error);
      next(error);
    }
  }

  /**
   * Create or update setting
   * PUT /api/settings/:key
   */
  async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value, type } = req.body;

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Value is required',
          },
        });
      }

      const setting = await settingsService.updateSetting(key, { value, type });

      res.json({
        success: true,
        message: 'Setting updated successfully',
        data: { setting },
      });
    } catch (error) {
      logger.error('Error updating setting:', error);
      next(error);
    }
  }

  /**
   * Bulk update settings
   * POST /api/settings/bulk
   */
  async bulkUpdateSettings(req, res, next) {
    try {
      const { settings } = req.body;

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Settings must be an array',
          },
        });
      }

      const updatedSettings = await settingsService.bulkUpdateSettings(settings);

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: { settings: updatedSettings },
      });
    } catch (error) {
      logger.error('Error bulk updating settings:', error);
      next(error);
    }
  }

  /**
   * Delete setting
   * DELETE /api/settings/:key
   */
  async deleteSetting(req, res, next) {
    try {
      const { key } = req.params;
      await settingsService.deleteSetting(key);

      res.json({
        success: true,
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting setting:', error);
      next(error);
    }
  }
}

export default new SettingsController();

