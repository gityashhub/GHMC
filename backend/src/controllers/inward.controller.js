import inwardService from '../services/inward.service.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Inward Entries Controller
 * Handles HTTP requests for inward entries
 */

class InwardController {
  /**
   * Get all inward entries
   * GET /api/inward
   */
  async getAllEntries(req, res, next) {
    try {
      const { page, limit, search, companyId, startDate, endDate, sortBy, sortOrder } = req.query;

      const result = await inwardService.getAllEntries({
        page,
        limit,
        search,
        companyId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        data: result.entries,
        pagination: result.pagination,
        message: 'Inward entries retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inward entry by ID
   * GET /api/inward/:id
   */
  async getEntryById(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await inwardService.getEntryById(id);

      res.status(200).json({
        success: true,
        data: { entry },
        message: 'Inward entry retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create inward entry
   * POST /api/inward
   */
  async createEntry(req, res, next) {
    try {
      const entryData = req.body;
      const entry = await inwardService.createEntry(entryData);

      logger.info(`Inward entry created: ${entry.lotNo} (${entry.id})`);

      res.status(201).json({
        success: true,
        data: { entry },
        message: 'Inward entry created successfully',
      });
    } catch (error) {
      // DEBUG: Log detailed error to file
      try {
        const logPath = path.join(process.cwd(), 'creation_error.log');
        const timestamp = new Date().toISOString();
        const logContent = `\n[${timestamp}] Creation Failed:\nError: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error.details || 'No details', null, 2)}\nBody: ${JSON.stringify(req.body, null, 2)}\n----------------------------------------\n`;
        fs.appendFileSync(logPath, logContent);
        logger.error(`Creation error details written to ${logPath}`);
      } catch (logErr) {
        logger.error('Failed to write debug log:', logErr);
      }

      next(error);
    }
  }

  /**
   * Update inward entry
   * PUT /api/inward/:id
   */
  async updateEntry(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const entry = await inwardService.updateEntry(id, updateData);

      logger.info(`Inward entry updated: ${entry.lotNo} (${entry.id})`);

      res.status(200).json({
        success: true,
        data: { entry },
        message: 'Inward entry updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete inward entry
   * DELETE /api/inward/:id
   */
  async deleteEntry(req, res, next) {
    try {
      const { id } = req.params;
      await inwardService.deleteEntry(id);

      logger.info(`Inward entry deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Inward entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment
   * PUT /api/inward/:id/payment
   */
  async updatePayment(req, res, next) {
    try {
      const { id } = req.params;
      const paymentData = req.body;
      const entry = await inwardService.updatePayment(id, paymentData);

      logger.info(`Payment updated for inward entry: ${id}`);

      res.status(200).json({
        success: true,
        data: { entry },
        message: 'Payment updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inward statistics
   * GET /api/inward/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await inwardService.getStats();

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

export default new InwardController();

