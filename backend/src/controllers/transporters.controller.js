import transportersService from '../services/transporters.service.js';
import { logger } from '../utils/logger.js';

/**
 * Transporters Controller
 * Handles HTTP requests for transporters
 */

class TransportersController {
  /**
   * Get all transporters
   * GET /api/transporters
   */
  async getAllTransporters(req, res, next) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;

      const result = await transportersService.getAllTransporters({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        data: result.transporters,
        pagination: result.pagination,
        message: 'Transporters retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transporter by ID
   * GET /api/transporters/:id
   */
  async getTransporterById(req, res, next) {
    try {
      const { id } = req.params;
      const transporter = await transportersService.getTransporterById(id);

      res.status(200).json({
        success: true,
        data: { transporter },
        message: 'Transporter retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create transporter
   * POST /api/transporters
   */
  async createTransporter(req, res, next) {
    try {
      const transporterData = req.body;
      const transporter = await transportersService.createTransporter(transporterData);

      logger.info(`Transporter created: ${transporter.name} (${transporter.id})`);

      res.status(201).json({
        success: true,
        data: { transporter },
        message: 'Transporter created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update transporter
   * PUT /api/transporters/:id
   */
  async updateTransporter(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const transporter = await transportersService.updateTransporter(id, updateData);

      logger.info(`Transporter updated: ${transporter.name} (${transporter.id})`);

      res.status(200).json({
        success: true,
        data: { transporter },
        message: 'Transporter updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete transporter
   * DELETE /api/transporters/:id
   */
  async deleteTransporter(req, res, next) {
    try {
      const { id } = req.params;
      await transportersService.deleteTransporter(id);

      logger.info(`Transporter deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Transporter deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transporter statistics
   * GET /api/transporters/:id/stats
   */
  async getTransporterStats(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await transportersService.getTransporterStats(id);

      res.status(200).json({
        success: true,
        data: { stats },
        message: 'Statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get global statistics
   * GET /api/transporters/stats/all
   */
  async getGlobalStats(req, res, next) {
    try {
      const stats = await transportersService.getGlobalStats();

      res.status(200).json({
        success: true,
        data: { stats },
        message: 'Global statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransportersController();

