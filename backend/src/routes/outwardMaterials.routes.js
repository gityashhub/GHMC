import express from 'express';
import outwardMaterialsController from '../controllers/outwardMaterials.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, createOutwardMaterialSchema, updateOutwardMaterialSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Outward Materials Routes
 * All routes require authentication
 */

// Get all outward materials
router.get('/', authenticate, outwardMaterialsController.getAllMaterials.bind(outwardMaterialsController));

// Get outward material by ID
router.get('/:id', authenticate, outwardMaterialsController.getMaterialById.bind(outwardMaterialsController));

// Create outward material
router.post(
    '/',
    authenticate,
    validate(createOutwardMaterialSchema),
    outwardMaterialsController.createMaterial.bind(outwardMaterialsController)
);

// Update outward material
router.put(
    '/:id',
    authenticate,
    validate(updateOutwardMaterialSchema),
    outwardMaterialsController.updateMaterial.bind(outwardMaterialsController)
);

// Delete outward material
router.delete('/:id', authenticate, outwardMaterialsController.deleteMaterial.bind(outwardMaterialsController));

export default router;
