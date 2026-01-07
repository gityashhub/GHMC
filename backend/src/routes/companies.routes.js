import express from 'express';
import companiesController from '../controllers/companies.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validate,
  createCompanySchema,
  updateCompanySchema,
  addMaterialSchema,
  updateMaterialSchema,
} from '../utils/validators.js';

const router = express.Router();

/**
 * Companies Routes
 * All routes require authentication
 */

// Get all companies
router.get('/', authenticate, companiesController.getAllCompanies.bind(companiesController));

// Get global statistics
router.get('/stats/all', authenticate, companiesController.getGlobalStats.bind(companiesController));

// Get company by ID
router.get('/:id', authenticate, companiesController.getCompanyById.bind(companiesController));

// Create company
router.post(
  '/',
  authenticate,
  validate(createCompanySchema),
  companiesController.createCompany.bind(companiesController)
);

// Update company
router.put(
  '/:id',
  authenticate,
  validate(updateCompanySchema),
  companiesController.updateCompany.bind(companiesController)
);

// Delete company
router.delete('/:id', authenticate, companiesController.deleteCompany.bind(companiesController));

// Get company materials
router.get('/:id/materials', authenticate, companiesController.getCompanyMaterials.bind(companiesController));

// Add material to company
router.post(
  '/:id/materials',
  authenticate,
  validate(addMaterialSchema),
  companiesController.addMaterial.bind(companiesController)
);

// Update material
router.put(
  '/:id/materials/:materialId',
  authenticate,
  validate(updateMaterialSchema),
  companiesController.updateMaterial.bind(companiesController)
);

// Remove material from company
router.delete(
  '/:id/materials/:materialId',
  authenticate,
  companiesController.removeMaterial.bind(companiesController)
);

// Get company statistics
router.get('/:id/stats', authenticate, companiesController.getCompanyStats.bind(companiesController));

export default router;

