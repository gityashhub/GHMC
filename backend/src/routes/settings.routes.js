import express from 'express';
import settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * Settings Routes
 * All routes require authentication
 */

// Get all settings
router.get('/', authenticate, authorize(['admin']), settingsController.getAllSettings.bind(settingsController));

// Get setting by key
router.get('/:key', authenticate, authorize(['admin']), settingsController.getSettingByKey.bind(settingsController));

// Update setting
router.put('/:key', authenticate, authorize(['admin']), settingsController.updateSetting.bind(settingsController));

// Bulk update settings
router.post('/bulk', authenticate, authorize(['admin']), settingsController.bulkUpdateSettings.bind(settingsController));

// Delete setting
router.delete('/:key', authenticate, authorize(['admin']), settingsController.deleteSetting.bind(settingsController));

export default router;

