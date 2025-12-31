import express from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * Dashboard Routes
 * All routes require authentication
 */

// Get dashboard statistics
router.get('/stats', authenticate, authorize(['admin']), dashboardController.getStats.bind(dashboardController));

// Get revenue chart data
router.get('/revenue', authenticate, authorize(['admin']), dashboardController.getRevenueChart.bind(dashboardController));

// Get payment status breakdown
router.get('/payment-status', authenticate, authorize(['admin']), dashboardController.getPaymentStatus.bind(dashboardController));

// Get recent activity
router.get('/recent-activity', authenticate, authorize(['admin']), dashboardController.getRecentActivity.bind(dashboardController));

// Get waste flow chart data
router.get('/waste-flow', authenticate, authorize(['admin']), dashboardController.getWasteFlow.bind(dashboardController));

export default router;

