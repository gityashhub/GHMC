import outwardService from '../services/outward.service.js';
import { logger } from '../utils/logger.js';

/**
 * Outward Entries Controller
 * Handles HTTP requests for outward entries
 */

class OutwardController {
  /**
   * Get all outward entries
   * GET /api/outward
   */
  async getAllEntries(req, res, next) {
    try {
      const { page, limit, search, transporterId, cementCompany, startDate, endDate, sortBy, sortOrder } = req.query;

      const result = await outwardService.getAllEntries({
        page,
        limit,
        search,
        transporterId,
        cementCompany,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        data: result.entries,
        pagination: result.pagination,
        message: 'Outward entries retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outward entry by ID
   * GET /api/outward/:id
   */
  async getEntryById(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await outwardService.getEntryById(id);

      res.status(200).json({
        success: true,
        data: { entry },
        message: 'Outward entry retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create outward entry
   * POST /api/outward
   */
  async createEntry(req, res, next) {
    try {
      const entryData = req.body;
      const entry = await outwardService.createEntry(entryData);

      logger.info(`Outward entry created: ${entry.manifestNo} (${entry.id})`);

      res.status(201).json({
        success: true,
        data: { entry },
        message: 'Outward entry created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update outward entry
   * PUT /api/outward/:id
   */
  async updateEntry(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const entry = await outwardService.updateEntry(id, updateData);

      logger.info(`Outward entry updated: ${entry.manifestNo} (${entry.id})`);

      res.status(200).json({
        success: true,
        data: { entry },
        message: 'Outward entry updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete outward entry
   * DELETE /api/outward/:id
   */
  async deleteEntry(req, res, next) {
    try {
      const { id } = req.params;
      await outwardService.deleteEntry(id);

      logger.info(`Outward entry deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Outward entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consolidated summary
   * GET /api/outward/summary
   */
  async getSummary(req, res, next) {
    try {
      const { month, cementCompany, transporterId } = req.query;
      const summary = await outwardService.getSummary({ month, cementCompany, transporterId });

      res.status(200).json({
        success: true,
        data: { summary },
        message: 'Summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get outward statistics
   * GET /api/outward/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await outwardService.getStats();

      res.status(200).json({
        success: true,
        data: { stats },
        message: 'Statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OutwardController();

