import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { roundValue } from '../utils/math.js';

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
          { company: { name: { contains: search, mode: 'insensitive' } } },
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
          invoice: {
            include: {
              invoiceMaterials: true,
              _count: {
                select: { inwardEntries: true }
              }
            }
          },
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
      remarks,
    } = entryData;

    // Validate required fields
    if (!date || !companyId || !manifestNo || !wasteName || !quantity || !unit) {
      throw new ValidationError('Date, company, manifest number, waste name, quantity, and unit are required');
    }

    // Use transaction to ensure data consistency and reduce race conditions
    const entry = await prisma.$transaction(async (tx) => {
      // Check if company exists and get materials
      const company = await tx.company.findUnique({
        where: { id: companyId },
        include: {
          materials: true,
        },
      });

      if (!company) {
        throw new NotFoundError('Company');
      }

      // Auto-populate rate from company material if not provided
      let finalRate = rate;
      if (!finalRate || finalRate === null || finalRate === undefined) {
        // Find material with case-insensitive and trimmed comparison
        const searchName = wasteName.trim().toLowerCase();
        const material = (company.materials || []).find(m =>
          m.materialName && m.materialName.trim().toLowerCase() === searchName
        );
        if (material && material.rate) {
          finalRate = material.rate;
        }
      }

      // Generate sr_no if not provided
      // Doing this inside transaction reduces race condition window
      let srNo = entryData.srNo;
      if (!srNo) {
        const lastEntry = await tx.inwardEntry.findFirst({
          orderBy: { srNo: 'desc' },
          select: { srNo: true },
        });
        srNo = lastEntry?.srNo ? lastEntry.srNo + 1 : 1;
      }

      // Generate unique lot number if not provided
      let finalLotNo = lotNo;
      if (!finalLotNo) {
        // Reuse the logic but adapted for transaction
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        const lastLotEntry = await tx.inwardEntry.findFirst({
          where: {
            lotNo: {
              startsWith: `LOT-${year}${month}`,
            },
          },
          orderBy: { createdAt: 'desc' },
          select: { lotNo: true },
        });

        if (lastLotEntry?.lotNo) {
          const lastNum = parseInt(lastLotEntry.lotNo.split('-').pop()) || 0;
          finalLotNo = `LOT-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`;
        } else {
          finalLotNo = `LOT-${year}${month}-0001`;
        }
      }

      // Check lot number uniqueness
      if (finalLotNo) {
        const existing = await tx.inwardEntry.findUnique({
          where: { lotNo: finalLotNo },
        });

        if (existing) {
          throw new ValidationError('Lot number already exists');
        }
      }

      // Create entry
      return await tx.inwardEntry.create({
        data: {
          srNo,
          date: new Date(date),
          lotNo: finalLotNo,
          companyId,
          manifestNo: manifestNo.trim(),
          vehicleNo: vehicleNo?.trim() || null,
          wasteName: wasteName.trim(),
          rate: roundValue(finalRate),
          category: category?.trim() || null,
          quantity: roundValue(quantity),
          unit: unit.trim(),
          month: month?.trim() || null,
          remarks: remarks?.trim() || null,
        },
        include: {
          company: true,
          invoice: true,
          inwardMaterials: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
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
        ...(updateData.rate !== undefined && { rate: roundValue(updateData.rate) }),
        ...(updateData.category !== undefined && { category: updateData.category?.trim() || null }),
        ...(updateData.quantity !== undefined && { quantity: roundValue(updateData.quantity) }),
        ...(updateData.unit !== undefined && { unit: updateData.unit.trim() }),
        ...(updateData.month !== undefined && { month: updateData.month?.trim() || null }),
        ...(updateData.lotNo !== undefined && { lotNo: updateData.lotNo?.trim() || null }),
        ...(updateData.remarks !== undefined && { remarks: updateData.remarks?.trim() || null }),
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
    // 1. Get all entries to calculate unit-aware quantity
    const entries = await prisma.inwardEntry.findMany({
      select: {
        quantity: true,
        unit: true,
      },
    });

    const toMT = (quantity, unit) => {
      const g = parseFloat(quantity || 0);
      if (unit === 'MT') return g;
      if (unit === 'Kg') return g / 1000;
      if (unit === 'KL') return g;
      return g;
    };

    let totalMT = 0;
    let totalQuantityRaw = 0;
    let allKg = entries.length > 0;

    entries.forEach(e => {
      const qty = parseFloat(e.quantity || 0);
      totalMT += toMT(qty, e.unit);
      totalQuantityRaw += qty;
      if (e.unit !== 'Kg') allKg = false;
    });

    const totalQuantity = allKg && entries.length > 0 ? totalQuantityRaw : totalMT;
    const unit = allKg && entries.length > 0 ? 'KG' : 'MT';

    // 2. Count total entries
    const totalEntries = entries.length;

    // 3. Calculate Invoiced Value and Payment Received from UNIQUE invoices
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

    let totalInvoiced = 0;
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

      totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
      totalReceived = invoices.reduce((sum, inv) => sum + Number(inv.paymentReceived), 0);
    }

    return {
      totalEntries,
      totalQuantity,
      unit,
      totalInvoiced,
      totalReceived,
    };
  }
}

export default new InwardService();

