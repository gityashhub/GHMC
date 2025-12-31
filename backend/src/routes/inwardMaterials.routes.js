import express from 'express';
import inwardMaterialsController from '../controllers/inwardMaterials.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, createInwardMaterialSchema, updateInwardMaterialSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Inward Materials Routes
 * All routes require authentication
 */

// Get all inward materials
router.get('/', authenticate, inwardMaterialsController.getAllMaterials.bind(inwardMaterialsController));

// Get inward material by ID
router.get('/:id', authenticate, inwardMaterialsController.getMaterialById.bind(inwardMaterialsController));

// Create inward material
router.post(
  '/',
  authenticate,
  validate(createInwardMaterialSchema),
  inwardMaterialsController.createMaterial.bind(inwardMaterialsController)
);

// Update inward material
router.put(
  '/:id',
  authenticate,
  validate(updateInwardMaterialSchema),
  inwardMaterialsController.updateMaterial.bind(inwardMaterialsController)
);

// Delete inward material
router.delete('/:id', authenticate, inwardMaterialsController.deleteMaterial.bind(inwardMaterialsController));

export default router;

