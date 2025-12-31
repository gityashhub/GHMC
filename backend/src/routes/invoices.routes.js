import express from 'express';
import invoicesController from '../controllers/invoices.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate, createInvoiceSchema, updateInvoiceSchema, updateInvoicePaymentSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * Invoices Routes
 * All routes require authentication
 */

// Get all invoices
router.get('/', authenticate, authorize(['admin']), invoicesController.getAllInvoices.bind(invoicesController));

// Get invoice statistics
router.get('/stats', authenticate, authorize(['admin']), invoicesController.getStats.bind(invoicesController));

// Get invoice by ID
router.get('/:id', authenticate, authorize(['admin']), invoicesController.getInvoiceById.bind(invoicesController));

// Create invoice
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate(createInvoiceSchema),
  invoicesController.createInvoice.bind(invoicesController)
);

// Update invoice
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validate(updateInvoiceSchema),
  invoicesController.updateInvoice.bind(invoicesController)
);

// Update invoice payment
router.put(
  '/:id/payment',
  authenticate,
  authorize(['admin']),
  validate(updateInvoicePaymentSchema),
  invoicesController.updatePayment.bind(invoicesController)
);

// Delete invoice
router.delete('/:id', authenticate, authorize(['admin']), invoicesController.deleteInvoice.bind(invoicesController));

export default router;

