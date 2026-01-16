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
      wasteName = '',
      month = '',
      startDate = '',
      endDate = '',
      sortBy = 'date',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    const andConditions = [];

    // Search creates OR conditions
    if (search) {
      andConditions.push({
        OR: [
          { manifestNo: { contains: search, mode: 'insensitive' } },
          { lotNo: { contains: search, mode: 'insensitive' } },
          { wasteName: { contains: search, mode: 'insensitive' } },
          { month: { contains: search, mode: 'insensitive' } },
          { vehicleNo: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Filters create AND conditions
    if (companyId) {
      andConditions.push({ companyId });
    }

    if (wasteName) {
      andConditions.push({ wasteName: { contains: wasteName, mode: 'insensitive' } });
    }

    if (month) {
      andConditions.push({ month: { contains: month, mode: 'insensitive' } });
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      andConditions.push({ date: dateFilter });
    }

    // Combine all conditions with AND
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Get entries and total count
    const [entries, total] = await Promise.all([
      prisma.inwardEntry.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: true,
          invoice: true,
          inwardMaterials: {
            orderBy: { createdAt: 'asc' },
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

    // Auto-populate rate if not provided
    let finalRate = rate ? parseFloat(rate) : null;
    if (finalRate === null) {
      const companyMaterial = await prisma.companyMaterial.findFirst({
        where: {
          companyId,
          materialName: wasteName.trim(),
        },
      });
      if (companyMaterial) {
        finalRate = companyMaterial.rate;
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
        rate: finalRate,
        category: category?.trim() || null,
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        month: month?.trim() || null,
      },
      include: {
        company: true,
        invoice: true,
        inwardMaterials: {
          orderBy: { createdAt: 'asc' },
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
        ...(updateData.rate !== undefined ? { rate: updateData.rate ? parseFloat(updateData.rate) : null } : (
          (updateData.wasteName !== undefined || updateData.companyId !== undefined) ? {
            rate: await (async () => {
              const currentEntry = await prisma.inwardEntry.findUnique({ where: { id: entryId } });
              const cid = updateData.companyId || currentEntry.companyId;
              const wn = updateData.wasteName || currentEntry.wasteName;
              const cm = await prisma.companyMaterial.findFirst({
                where: { companyId: cid, materialName: wn.trim() }
              });
              return cm ? cm.rate : currentEntry.rate;
            })()
          } : {}
        )),
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
  /**
   * Get inward statistics
   * @returns {Promise<object>} Statistics object
   */
  async getStats() {
    // 1. Get basic aggregations (Count and Quantity)
    const aggregations = await prisma.inwardEntry.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
    });

    const totalEntries = aggregations._count.id;
    const totalQuantity = Number(aggregations._sum.quantity) || 0;

    // 2. Calculate Uninvoiced Value (Estimated: Qty * Rate * 1.18 GST)
    const uninvoicedEntries = await prisma.inwardEntry.findMany({
      where: {
        invoiceId: null,
      },
      select: {
        quantity: true,
        rate: true,
      },
    });

    const uninvoicedValue = uninvoicedEntries.reduce((sum, entry) => {
      const amount = Number(entry.quantity) * (Number(entry.rate) || 0);
      const gstAmount = amount * 0.18; // 18% GST estimate
      return sum + amount + gstAmount;
    }, 0);

    // 3. Calculate Invoiced Value and Payment Received from UNIQUE invoices
    // We strictly use the Invoice's Grand Total, as it is the source of truth for the bill (including extra charges)
    const distinctInvoices = await prisma.inwardEntry.findMany({
      where: {
        invoiceId: { not: null }
      },
      select: {
        invoiceId: true
      },
      distinct: ['invoiceId']
    });

    const invoiceIds = distinctInvoices.map(e => e.invoiceId);

    let invoicedTotal = 0;
    let totalReceived = 0;

    if (invoiceIds.length > 0) {
      const invoices = await prisma.invoice.findMany({
        where: {
          id: { in: invoiceIds }
        },
        select: {
          grandTotal: true,
          paymentReceived: true,
        }
      });

      invoicedTotal = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
      totalReceived = invoices.reduce((sum, inv) => sum + Number(inv.paymentReceived), 0);
    }

    const totalInvoiced = uninvoicedValue + invoicedTotal;

    return {
      totalEntries,
      totalQuantity,
      totalInvoiced,
      totalReceived,
    };
  }
}

export default new InwardService();

