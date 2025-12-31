import dashboardService from '../services/dashboard.service.js';
import { logger } from '../utils/logger.js';

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard operations
 */

class DashboardController {
  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats();

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      next(error);
    }
  }

  /**
   * Get revenue chart data
   * GET /api/dashboard/revenue
   */
  async getRevenueChart(req, res, next) {
    try {
      const { year } = req.query;
      const yearNum = year ? parseInt(year) : null;
      const data = await dashboardService.getRevenueChartData(yearNum);

      res.json({
        success: true,
        data: { chartData: data },
      });
    } catch (error) {
      logger.error('Error fetching revenue chart data:', error);
      next(error);
    }
  }

  /**
   * Get payment status breakdown
   * GET /api/dashboard/payment-status
   */
  async getPaymentStatus(req, res, next) {
    try {
      const data = await dashboardService.getPaymentStatus();

      res.json({
        success: true,
        data: { paymentStatus: data },
      });
    } catch (error) {
      logger.error('Error fetching payment status:', error);
      next(error);
    }
  }

  /**
   * Get recent activity
   * GET /api/dashboard/recent-activity
   */
  async getRecentActivity(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit);
      const data = await dashboardService.getRecentActivity(limitNum);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      next(error);
    }
  }

  /**
   * Get waste flow chart data
   * GET /api/dashboard/waste-flow
   */
  async getWasteFlow(req, res, next) {
    try {
      const { year } = req.query;
      const yearNum = year ? parseInt(year) : null;
      const data = await dashboardService.getWasteFlowData(yearNum);

      res.json({
        success: true,
        data: { chartData: data },
      });
    } catch (error) {
      logger.error('Error fetching waste flow data:', error);
      next(error);
    }
  }
}

export default new DashboardController();

