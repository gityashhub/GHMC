import invoicesService from '../services/invoices.service.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Invoices Controller
 * Handles HTTP requests for invoice operations
 */

class InvoicesController {
  /**
   * Get all invoices
   * GET /api/invoices
   */
  async getAllInvoices(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        type = '',
        status = '',
        startDate = '',
        endDate = '',
        companyId = '',
        transporterId = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const result = await invoicesService.getAllInvoices({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        type,
        status,
        startDate,
        endDate,
        companyId,
        transporterId,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      next(error);
    }
  }

  /**
   * Get invoice by ID
   * GET /api/invoices/:id
   */
  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoicesService.getInvoiceById(id);

      res.json({
        success: true,
        data: { invoice },
      });
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      next(error);
    }
  }

  /**
   * Create invoice
   * POST /api/invoices
   */
  async createInvoice(req, res, next) {
    try {
      const invoice = await invoicesService.createInvoice(req.body);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: { invoice },
      });
    } catch (error) {
      logger.error('Error creating invoice:', error);
      next(error);
    }
  }

  /**
   * Update invoice
   * PUT /api/invoices/:id
   */
  async updateInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoicesService.updateInvoice(id, req.body);

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: { invoice },
      });
    } catch (error) {
      logger.error('Error updating invoice:', error);
      next(error);
    }
  }

  /**
   * Update invoice payment
   * PUT /api/invoices/:id/payment
   */
  async updatePayment(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentReceived, paymentReceivedOn } = req.body;

      if (paymentReceived === undefined) {
        throw new ValidationError('Payment received amount is required');
      }

      const invoice = await invoicesService.updatePayment(id, {
        paymentReceived,
        paymentReceivedOn,
      });

      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: { invoice },
      });
    } catch (error) {
      logger.error('Error updating payment:', error);
      next(error);
    }
  }

  /**
   * Delete invoice
   * DELETE /api/invoices/:id
   */
  async deleteInvoice(req, res, next) {
    try {
      const { id } = req.params;
      await invoicesService.deleteInvoice(id);

      res.json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      next(error);
    }
  }

  /**
   * Get invoice statistics
   * GET /api/invoices/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await invoicesService.getStats();

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      logger.error('Error fetching invoice stats:', error);
      next(error);
    }
  }
}

export default new InvoicesController();

