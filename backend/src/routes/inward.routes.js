import express from 'express';
import inwardController from '../controllers/inward.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, createInwardEntrySchema, updateInwardEntrySchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Inward Entries Routes
 * All routes require authentication
 */

// Get all inward entries
router.get('/', authenticate, inwardController.getAllEntries.bind(inwardController));

// Get inward entry by ID
router.get('/:id', authenticate, inwardController.getEntryById.bind(inwardController));

// Create inward entry
router.post(
  '/',
  authenticate,
  validate(createInwardEntrySchema),
  inwardController.createEntry.bind(inwardController)
);

// Update inward entry
router.put(
  '/:id',
  authenticate,
  validate(updateInwardEntrySchema),
  inwardController.updateEntry.bind(inwardController)
);

// Delete inward entry
router.delete('/:id', authenticate, inwardController.deleteEntry.bind(inwardController));

// Update payment
router.put('/:id/payment', authenticate, inwardController.updatePayment.bind(inwardController));

// Get statistics
router.get('/stats/all', authenticate, inwardController.getStats.bind(inwardController));

// Note: /stats/all is used to avoid conflict with /:id route

export default router;

