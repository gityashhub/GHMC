import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Inward Entries Service
 * Handles all inward entry-related business logic
 */

class InwardService {
  /**
   * Get all inward entries with pagination, search, and filters
   * @param {object} options - Query options
   * @returns {Promise<{entries: array, pagination: object}>}
   */
  async getAllEntries(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      companyId = '',
      startDate = '',
      endDate = '',
      sortBy = 'date',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { manifestNo: { contains: search, mode: 'insensitive' } },
        { lotNo: { contains: search, mode: 'insensitive' } },
        { wasteName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get entries and total count
    const [entries, total] = await Promise.all([
      prisma.inwardEntry.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              gstNumber: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              grandTotal: true,
              paymentReceived: true,
              paymentReceivedOn: true,
            },
          },
          inwardMaterials: {
            select: {
              id: true,
              transporterName: true,
              rate: true,
              amount: true,
            },
          },
        },
      }),
      prisma.inwardEntry.count({ where }),
    ]);

    return {
      entries,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: page * take < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get inward entry by ID
   * @param {string} entryId - Entry ID
   * @returns {Promise<object>} Entry object
   */
  async getEntryById(entryId) {
    const entry = await prisma.inwardEntry.findUnique({
      where: { id: entryId },
      include: {
        company: true,
        invoice: true,
        inwardMaterials: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new NotFoundError('Inward entry');
    }

    return entry;
  }

  /**
   * Generate next sr_no
   * @returns {Promise<number>} Next sr_no
   */
  async getNextSrNo() {
    const lastEntry = await prisma.inwardEntry.findFirst({
      orderBy: { srNo: 'desc' },
      select: { srNo: true },
    });

    return lastEntry?.srNo ? lastEntry.srNo + 1 : 1;
  }

  /**
   * Generate unique lot number
   * @returns {Promise<string>} Lot number
   */
  async generateLotNo() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Find last lot number for this month
    const lastEntry = await prisma.inwardEntry.findFirst({
      where: {
        lotNo: {
          startsWith: `LOT-${year}${month}`,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { lotNo: true },
    });

    if (lastEntry?.lotNo) {
      const lastNum = parseInt(lastEntry.lotNo.split('-').pop()) || 0;
      return `LOT-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`;
    }

    return `LOT-${year}${month}-0001`;
  }

  /**
   * Create inward entry
   * @param {object} entryData - Entry data
   * @returns {Promise<object>} Created entry
   */
  async createEntry(entryData) {
    const {
      date,
      companyId,
      manifestNo,
      vehicleNo,
      wasteName,
      rate,
      category,
      quantity,
      unit,
      month,
      lotNo,
    } = entryData;

    // Validate required fields
    if (!date || !companyId || !manifestNo || !wasteName || !quantity || !unit) {
      throw new ValidationError('Date, company, manifest number, waste name, quantity, and unit are required');
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    // Generate sr_no if not provided
    const srNo = entryData.srNo || (await this.getNextSrNo());

    // Generate lot number if not provided
    const finalLotNo = lotNo || (await this.generateLotNo());

    // Check lot number uniqueness
    if (finalLotNo) {
      const existing = await prisma.inwardEntry.findUnique({
        where: { lotNo: finalLotNo },
      });

      if (existing) {
        throw new ValidationError('Lot number already exists');
      }
    }

    // Create entry
    const entry = await prisma.inwardEntry.create({
      data: {
        srNo,
        date: new Date(date),
        lotNo: finalLotNo,
        companyId,
        manifestNo: manifestNo.trim(),
        vehicleNo: vehicleNo?.trim() || null,
        wasteName: wasteName.trim(),
        rate: rate ? parseFloat(rate) : null,
        category: category?.trim() || null,
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        month: month?.trim() || null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            gstNumber: true,
          },
        },
      },
    });

    return entry;
  }

  /**
   * Update inward entry
   * @param {string} entryId - Entry ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated entry
   */
  async updateEntry(entryId, updateData) {
    await this.getEntryById(entryId); // Check if exists

    // Check lot number uniqueness if being updated
    if (updateData.lotNo) {
      const existing = await prisma.inwardEntry.findFirst({
        where: {
          lotNo: updateData.lotNo,
          id: { not: entryId },
        },
      });

      if (existing) {
        throw new ValidationError('Lot number already exists');
      }
    }

    // Update entry
    const updated = await prisma.inwardEntry.update({
      where: { id: entryId },
      data: {
        ...(updateData.date !== undefined && { date: new Date(updateData.date) }),
        ...(updateData.companyId !== undefined && { companyId: updateData.companyId }),
        ...(updateData.manifestNo !== undefined && { manifestNo: updateData.manifestNo.trim() }),
        ...(updateData.vehicleNo !== undefined && { vehicleNo: updateData.vehicleNo?.trim() || null }),
        ...(updateData.wasteName !== undefined && { wasteName: updateData.wasteName.trim() }),
        ...(updateData.rate !== undefined && { rate: updateData.rate ? parseFloat(updateData.rate) : null }),
        ...(updateData.category !== undefined && { category: updateData.category?.trim() || null }),
        ...(updateData.quantity !== undefined && { quantity: parseFloat(updateData.quantity) }),
        ...(updateData.unit !== undefined && { unit: updateData.unit.trim() }),
        ...(updateData.month !== undefined && { month: updateData.month?.trim() || null }),
        ...(updateData.lotNo !== undefined && { lotNo: updateData.lotNo?.trim() || null }),
      },
      include: {
        company: true,
        invoice: true,
        inwardMaterials: true,
      },
    });

    return updated;
  }

  /**
   * Delete inward entry
   * @param {string} entryId - Entry ID
   * @returns {Promise<void>}
   */
  async deleteEntry(entryId) {
    await this.getEntryById(entryId); // Check if exists

    await prisma.inwardEntry.delete({
      where: { id: entryId },
    });
  }

  /**
   * Update payment for inward entry
   * Note: Payment is tracked via invoice, but this can update invoice payment
   * @param {string} entryId - Entry ID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} Updated entry
   */
  async updatePayment(entryId, paymentData) {
    const entry = await this.getEntryById(entryId);

    // If entry has an invoice, payment should be updated on invoice
    // This endpoint is for future use when payment tracking is added to entries directly
    // For now, return the entry with its invoice payment info
    return entry;
  }

  /**
   * Get inward statistics
   * @returns {Promise<object>} Statistics object
   */
  async getStats() {
    const entries = await prisma.inwardEntry.findMany({
      include: {
        invoice: {
          select: {
            grandTotal: true,
            paymentReceived: true,
          },
        },
      },
    });

    const totalEntries = entries.length;
    const totalQuantity = entries.reduce((sum, e) => sum + Number(e.quantity), 0);

    // Calculate invoiced and received from linked invoices
    const totalInvoiced = entries
      .filter((e) => e.invoice)
      .reduce((sum, e) => sum + Number(e.invoice.grandTotal), 0);

    const totalReceived = entries
      .filter((e) => e.invoice)
      .reduce((sum, e) => sum + Number(e.invoice.paymentReceived), 0);

    return {
      totalEntries,
      totalQuantity,
      totalInvoiced,
      totalReceived,
    };
  }
}

export default new InwardService();

