import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import invoicesService from './invoices.service.js';

/**
 * Outward Entries Service
 * Handles all outward entry-related business logic
 */

class OutwardService {
  /**
   * Get all outward entries with pagination, search, and filters
   * @param {object} options - Query options
   * @returns {Promise<{entries: array, pagination: object}>}
   */
  async getAllEntries(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      transporterId = '',
      cementCompany = '',
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
          { vehicleNo: { contains: search, mode: 'insensitive' } },
          { wasteName: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Filters create AND conditions
    if (transporterId) {
      andConditions.push({ transporterId });
    }

    if (cementCompany) {
      andConditions.push({ cementCompany: { contains: cementCompany, mode: 'insensitive' } });
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
      prisma.outwardEntry.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          transporter: true,
          invoice: true,
        },
      }),
      prisma.outwardEntry.count({ where }),
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
   * Get outward entry by ID
   * @param {string} entryId - Entry ID
   * @returns {Promise<object>} Entry object
   */
  async getEntryById(entryId) {
    const entry = await prisma.outwardEntry.findUnique({
      where: { id: entryId },
      include: {
        transporter: true,
        invoice: true,
      },
    });

    if (!entry) {
      throw new NotFoundError('Outward entry');
    }

    return entry;
  }

  /**
   * Generate next sr_no
   * @returns {Promise<number>} Next sr_no
   */
  async getNextSrNo() {
    const lastEntry = await prisma.outwardEntry.findFirst({
      orderBy: { srNo: 'desc' },
      select: { srNo: true },
    });

    return lastEntry?.srNo ? lastEntry.srNo + 1 : 1;
  }

  /**
   * Create outward entry
   * @param {object} entryData - Entry data
   * @returns {Promise<object>} Created entry
   */
  async createEntry(entryData) {
    const {
      date,
      cementCompany,
      manifestNo,
      transporterId,
      vehicleNo,
      wasteName,
      quantity,
      unit,
      month,
      location,
      packing,
      rate,
      amount,
      gst,
      grossAmount,
      vehicleCapacity,
      detCharges,
      paidOn,
      dueOn,
      invoiceNo,
    } = entryData;

    // Validate required fields
    if (!date || !cementCompany || !manifestNo || !quantity || !unit) {
      throw new ValidationError('Date, cement company, manifest number, quantity, and unit are required');
    }

    // Check if transporter exists (if provided)
    if (transporterId) {
      const transporter = await prisma.transporter.findUnique({
        where: { id: transporterId },
      });

      if (!transporter) {
        throw new NotFoundError('Transporter');
      }
    }

    // Generate sr_no if not provided
    const srNo = entryData.srNo || (await this.getNextSrNo());

    // Calculate amount if rate and quantity provided
    let calculatedAmount = amount;
    if (!calculatedAmount && rate && quantity) {
      calculatedAmount = parseFloat(rate) * parseFloat(quantity);
    }

    // Calculate gross amount
    let calculatedGrossAmount = grossAmount;
    if (!calculatedGrossAmount) {
      calculatedGrossAmount = calculatedAmount || 0;
      if (detCharges) {
        calculatedGrossAmount += parseFloat(detCharges);
      }
      if (gst) {
        calculatedGrossAmount += parseFloat(gst);
      }
    }

    // Create entry
    // Resolve invoice via central invoices service (ensures consistency)
    let resolvedInvoiceId = null;
    if (invoiceNo) {
      const invoice = await invoicesService.ensureInvoiceForOutward({
        invoiceNo: invoiceNo.trim(),
        date,
        transporterId,
        customerName: cementCompany.trim(),
        materials: wasteName ? [{
          materialName: wasteName,
          rate: rate ? parseFloat(rate) : null,
          unit: unit,
          quantity: quantity ? parseFloat(quantity) : null,
          amount: calculatedAmount ? parseFloat(calculatedAmount) : null,
          manifestNo: manifestNo,
        }] : [],
        manifestNos: manifestNo ? [manifestNo] : [],
        outwardEntryIds: [], // link after create to avoid FK dependency
        subtotal: calculatedAmount ? parseFloat(calculatedAmount) : 0,
      });
      resolvedInvoiceId = invoice.id;
    }

    const entry = await prisma.outwardEntry.create({
      data: {
        srNo,
        month: month?.trim() || null,
        date: new Date(date),
        cementCompany: cementCompany.trim(),
        location: location?.trim() || null,
        manifestNo: manifestNo.trim(),
        transporterId: transporterId || null,
        vehicleNo: vehicleNo?.trim() || null,
        wasteName: wasteName?.trim() || null,
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        packing: packing?.trim() || null,
        rate: rate ? parseFloat(rate) : null,
        amount: calculatedAmount ? parseFloat(calculatedAmount) : null,
        gst: gst ? parseFloat(gst) : null,
        grossAmount: calculatedGrossAmount ? parseFloat(calculatedGrossAmount) : null,
        vehicleCapacity: vehicleCapacity?.trim() || null,
        detCharges: detCharges ? parseFloat(detCharges) : null,
        paidOn: paidOn ? new Date(paidOn) : null,
        dueOn: dueOn ? new Date(dueOn) : null,
        invoiceId: resolvedInvoiceId,
      },
      include: {
        transporter: true,
        invoice: true,
      },
    });

    // If invoice was created, link this entry to that invoice
    if (resolvedInvoiceId) {
      await prisma.outwardEntry.update({
        where: { id: entry.id },
        data: { invoiceId: resolvedInvoiceId },
      });
    }

    return entry;
  }

  /**
   * Update outward entry
   * @param {string} entryId - Entry ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated entry
   */
  async updateEntry(entryId, updateData) {
    await this.getEntryById(entryId); // Check if exists

    // Recalculate amount and gross amount if needed
    let amount = updateData.amount;
    if (updateData.rate !== undefined || updateData.quantity !== undefined) {
      const entry = await this.getEntryById(entryId);
      const rate = updateData.rate !== undefined ? parseFloat(updateData.rate) : Number(entry.rate);
      const quantity = updateData.quantity !== undefined ? parseFloat(updateData.quantity) : Number(entry.quantity);

      if (rate && quantity) {
        amount = rate * quantity;
      }
    }

    // Recalculate gross amount
    let grossAmount = amount || 0;
    if (updateData.detCharges !== undefined) {
      grossAmount += parseFloat(updateData.detCharges) || 0;
    } else {
      const entry = await this.getEntryById(entryId);
      grossAmount += Number(entry.detCharges) || 0;
    }

    if (updateData.gst !== undefined) {
      grossAmount += parseFloat(updateData.gst) || 0;
    } else {
      const entry = await this.getEntryById(entryId);
      grossAmount += Number(entry.gst) || 0;
    }

    // Update entry
    const updated = await prisma.outwardEntry.update({
      where: { id: entryId },
      data: {
        ...(updateData.date !== undefined && { date: new Date(updateData.date) }),
        ...(updateData.cementCompany !== undefined && { cementCompany: updateData.cementCompany.trim() }),
        ...(updateData.location !== undefined && { location: updateData.location?.trim() || null }),
        ...(updateData.manifestNo !== undefined && { manifestNo: updateData.manifestNo.trim() }),
        ...(updateData.transporterId !== undefined && { transporterId: updateData.transporterId || null }),
        ...(updateData.vehicleNo !== undefined && { vehicleNo: updateData.vehicleNo?.trim() || null }),
        ...(updateData.wasteName !== undefined && { wasteName: updateData.wasteName?.trim() || null }),
        ...(updateData.quantity !== undefined && { quantity: parseFloat(updateData.quantity) }),
        ...(updateData.unit !== undefined && { unit: updateData.unit.trim() }),
        ...(updateData.packing !== undefined && { packing: updateData.packing?.trim() || null }),
        ...(updateData.month !== undefined && { month: updateData.month?.trim() || null }),
        ...(updateData.rate !== undefined && { rate: updateData.rate ? parseFloat(updateData.rate) : null }),
        ...(updateData.gst !== undefined && { gst: updateData.gst ? parseFloat(updateData.gst) : null }),
        ...(updateData.vehicleCapacity !== undefined && { vehicleCapacity: updateData.vehicleCapacity?.trim() || null }),
        ...(updateData.detCharges !== undefined && { detCharges: updateData.detCharges ? parseFloat(updateData.detCharges) : null }),
        ...(updateData.paidOn !== undefined && { paidOn: updateData.paidOn ? new Date(updateData.paidOn) : null }),
        ...(updateData.dueOn !== undefined && { dueOn: updateData.dueOn ? new Date(updateData.dueOn) : null }),
        ...(amount !== undefined && { amount: amount ? parseFloat(amount) : null }),
        ...(grossAmount !== undefined && { grossAmount: grossAmount ? parseFloat(grossAmount) : null }),
        ...(updateData.invoiceNo !== undefined && {
          invoiceId: await (async () => {
            if (!updateData.invoiceNo) return null;
            const existing = await this.getEntryById(entryId);
            const linked = await invoicesService.ensureInvoiceForOutward({
              invoiceNo: updateData.invoiceNo.trim(),
              date: updateData.date || existing.date,
              transporterId: updateData.transporterId !== undefined ? updateData.transporterId || null : existing.transporterId || null,
              customerName: existing.cementCompany,
              materials: existing.wasteName ? [{
                materialName: existing.wasteName,
                rate: (updateData.rate !== undefined ? updateData.rate : existing.rate) ? parseFloat(updateData.rate !== undefined ? updateData.rate : String(existing.rate)) : null,
                unit: existing.unit,
                quantity: (updateData.quantity !== undefined ? updateData.quantity : Number(existing.quantity)) || null,
                amount: (amount !== undefined ? amount : Number(existing.amount)) || null,
                manifestNo: existing.manifestNo,
              }] : [],
              manifestNos: existing.manifestNo ? [existing.manifestNo] : [],
              outwardEntryIds: [entryId],
              subtotal: (amount !== undefined ? amount : Number(existing.amount)) || 0,
            });
            return linked.id;
          })(),
        }),
      },
      include: {
        transporter: true,
        invoice: true,
      },
    });

    return updated;
  }

  /**
   * Delete outward entry
   * @param {string} entryId - Entry ID
   * @returns {Promise<void>}
   */
  async deleteEntry(entryId) {
    await this.getEntryById(entryId); // Check if exists

    await prisma.outwardEntry.delete({
      where: { id: entryId },
    });
  }

  /**
   * Get consolidated summary
   * @param {object} options - Filter options
   * @returns {Promise<array>} Summary array
   */
  async getSummary(options = {}) {
    const { month = '', cementCompany = '', transporterId = '' } = options;

    const where = {};
    if (month) {
      where.month = month;
    }
    if (cementCompany) {
      where.cementCompany = { contains: cementCompany, mode: 'insensitive' };
    }
    if (transporterId) {
      where.transporterId = transporterId;
    }

    const entries = await prisma.outwardEntry.findMany({
      where,
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            transporterId: true,
          },
        },
      },
    });

    // Group by month, cement company, and transporter
    const grouped = {};
    entries.forEach((entry) => {
      const key = `${entry.month || 'N/A'}-${entry.cementCompany}-${entry.transporterId || 'N/A'}`;

      if (!grouped[key]) {
        grouped[key] = {
          month: entry.month || 'N/A',
          cementCompany: entry.cementCompany,
          transporterId: entry.transporterId,
          transporterName: entry.transporter?.name || 'N/A',
          totalQuantity: 0,
          totalAmount: 0,
          totalGrossAmount: 0,
          count: 0,
        };
      }

      grouped[key].totalQuantity += Number(entry.quantity);
      grouped[key].totalAmount += Number(entry.amount || 0);
      grouped[key].totalGrossAmount += Number(entry.grossAmount || 0);
      grouped[key].count += 1;
    });

    return Object.values(grouped);
  }

  /**
   * Get outward statistics
   * @returns {Promise<object>} Statistics object
   */
  async getStats() {
    const entries = await prisma.outwardEntry.findMany({
      include: {
        invoice: {
          select: {
            grandTotal: true,
            paymentReceived: true,
          },
        },
      },
    });

    const totalDispatches = entries.length;
    const totalQuantity = entries.reduce((sum, e) => sum + Number(e.quantity), 0);

    // Calculate invoiced and received from linked invoices
    const totalInvoiced = entries
      .filter((e) => e.invoice)
      .reduce((sum, e) => sum + Number(e.invoice.grandTotal), 0);

    const totalReceived = entries
      .filter((e) => e.invoice)
      .reduce((sum, e) => sum + Number(e.invoice.paymentReceived), 0);

    return {
      totalDispatches,
      totalQuantity,
      totalInvoiced,
      totalReceived,
    };
  }
}

export default new OutwardService();

