import express from 'express';
import outwardController from '../controllers/outward.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, createOutwardEntrySchema, updateOutwardEntrySchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Outward Entries Routes
 * All routes require authentication
 */

// Get all outward entries
router.get('/', authenticate, outwardController.getAllEntries.bind(outwardController));

// Get outward entry by ID
router.get('/:id', authenticate, outwardController.getEntryById.bind(outwardController));

// Create outward entry
router.post(
  '/',
  authenticate,
  validate(createOutwardEntrySchema),
  outwardController.createEntry.bind(outwardController)
);

// Update outward entry
router.put(
  '/:id',
  authenticate,
  validate(updateOutwardEntrySchema),
  outwardController.updateEntry.bind(outwardController)
);

// Delete outward entry
router.delete('/:id', authenticate, outwardController.deleteEntry.bind(outwardController));

// Get consolidated summary
router.get('/summary/all', authenticate, outwardController.getSummary.bind(outwardController));

// Get statistics
router.get('/stats/all', authenticate, outwardController.getStats.bind(outwardController));

// Note: /summary/all and /stats/all are used to avoid conflict with /:id route

export default router;

