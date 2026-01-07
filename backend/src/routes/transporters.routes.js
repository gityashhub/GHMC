import express from 'express';
import transportersController from '../controllers/transporters.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, createTransporterSchema, updateTransporterSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Transporters Routes
 * All routes require authentication
 */

// Get all transporters
router.get('/', authenticate, transportersController.getAllTransporters.bind(transportersController));

// Get global statistics
router.get('/stats/all', authenticate, transportersController.getGlobalStats.bind(transportersController));

// Get transporter by ID
router.get('/:id', authenticate, transportersController.getTransporterById.bind(transportersController));

// Create transporter
router.post(
  '/',
  authenticate,
  validate(createTransporterSchema),
  transportersController.createTransporter.bind(transportersController)
);

// Update transporter
router.put(
  '/:id',
  authenticate,
  validate(updateTransporterSchema),
  transportersController.updateTransporter.bind(transportersController)
);

// Delete transporter
router.delete('/:id', authenticate, transportersController.deleteTransporter.bind(transportersController));

// Get transporter statistics
router.get('/:id/stats', authenticate, transportersController.getTransporterStats.bind(transportersController));

export default router;

