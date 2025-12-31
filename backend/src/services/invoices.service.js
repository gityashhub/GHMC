import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

/**
 * Invoices Service
 * Handles all invoice-related business logic
 */

class InvoicesService {
  /**
   * Generate invoice number
   * Format: INV-YYYYMM-XXXX or from settings
   * @returns {Promise<string>} Invoice number
   */
  async generateInvoiceNo() {
    // Try to get format from settings
    const setting = await prisma.setting.findUnique({
      where: { key: 'invoice_number_format' },
    });

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Default format: INV-YYYYMM-XXXX
    const prefix = setting?.value || `INV-${year}${month}`;

    // Find last invoice with this prefix
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNo: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNo: true },
    });

    if (lastInvoice?.invoiceNo) {
      const parts = lastInvoice.invoiceNo.split('-');
      const lastNum = parseInt(parts[parts.length - 1]) || 0;
      return `${prefix}-${String(lastNum + 1).padStart(4, '0')}`;
    }

    return `${prefix}-0001`;
  }

  /**
   * Get GST rates from settings
   * @returns {Promise<{cgst: number, sgst: number}>}
   */
  async getGSTRates() {
    const [cgstSetting, sgstSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'cgst_rate' } }),
      prisma.setting.findUnique({ where: { key: 'sgst_rate' } }),
    ]);

    return {
      cgst: cgstSetting?.value ? parseFloat(cgstSetting.value) : 9, // Default 9%
      sgst: sgstSetting?.value ? parseFloat(sgstSetting.value) : 9, // Default 9%
    };
  }

  /**
   * Calculate invoice totals
   * @param {number} subtotal - Subtotal amount
   * @param {object} options - Options for calculation
   * @returns {Promise<{cgst: number, sgst: number, grandTotal: number}>}
   */
  async calculateTotals(subtotal, options = {}) {
    const { cgstRate, sgstRate } = options;

    let cgst = 0;
    let sgst = 0;

    if (cgstRate !== undefined && sgstRate !== undefined) {
      cgst = (subtotal * cgstRate) / 100;
      sgst = (subtotal * sgstRate) / 100;
    } else {
      const rates = await this.getGSTRates();
      cgst = (subtotal * rates.cgst) / 100;
      sgst = (subtotal * rates.sgst) / 100;
    }

    const grandTotal = subtotal + cgst + sgst;

    return {
      cgst: parseFloat(cgst.toFixed(2)),
      sgst: parseFloat(sgst.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    };
  }

  /**
   * Determine invoice status based on payment
   * @param {number} paymentReceived - Payment received
   * @param {number} grandTotal - Grand total
   * @returns {string} Status: 'paid', 'partial', or 'pending'
   */
  getStatus(paymentReceived, grandTotal) {
    if (paymentReceived >= grandTotal) return 'paid';
    if (paymentReceived > 0) return 'partial';
    return 'pending';
  }

  /**
   * Get all invoices with pagination, search, and filters
   * @param {object} options - Query options
   * @returns {Promise<{invoices: array, pagination: object}>}
   */
  async getAllInvoices(options = {}) {
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
    } = options;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (transporterId) {
      where.transporterId = transporterId;
    }

    // Get invoices and total count
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          transporter: {
            select: {
              id: true,
              name: true,
              gstNumber: true,
            },
          },
          invoiceManifests: {
            select: {
              manifestNo: true,
            },
          },
          invoiceMaterials: {
            select: {
              id: true,
              materialName: true,
              rate: true,
              unit: true,
              quantity: true,
              amount: true,
              manifestNo: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<object>} Invoice
   */
  async getInvoiceById(invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            contact: true,
            email: true,
            gstNumber: true,
          },
        },
        transporter: {
          select: {
            id: true,
            transporterId: true,
            name: true,
            contact: true,
            address: true,
            email: true,
            gstNumber: true,
          },
        },
        invoiceManifests: {
          select: {
            id: true,
            manifestNo: true,
          },
        },
        invoiceMaterials: {
          select: {
            id: true,
            materialName: true,
            rate: true,
            unit: true,
            quantity: true,
            amount: true,
            manifestNo: true,
          },
        },
        inwardEntries: {
          select: {
            id: true,
            srNo: true,
            date: true,
            lotNo: true,
            manifestNo: true,
            wasteName: true,
            quantity: true,
            unit: true,
          },
        },
        outwardEntries: {
          select: {
            id: true,
            srNo: true,
            date: true,
            manifestNo: true,
            cementCompany: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  /**
   * Create invoice
   * @param {object} invoiceData - Invoice data
   * @returns {Promise<object>} Created invoice
   */
  async createInvoice(invoiceData) {
    const {
      type,
      date,
      companyId,
      transporterId,
      customerName,
      invoiceNo: explicitInvoiceNo,
      materials = [],
      manifestNos = [],
      inwardEntryIds = [],
      outwardEntryIds = [],
      subtotal,
      cgstRate,
      sgstRate,
      gstNo,
      billedTo,
      shippedTo,
      description,
      paymentReceived,
      paymentReceivedOn,
    } = invoiceData;

    // Validate type
    if (!['Inward', 'Outward', 'Transporter'].includes(type)) {
      throw new ValidationError('Invalid invoice type. Must be Inward, Outward, or Transporter');
    }

    // Validate company or transporter
    if (type === 'Inward' && !companyId) {
      throw new ValidationError('Company ID is required for Inward invoices');
    }

    if ((type === 'Outward' || type === 'Transporter') && !transporterId) {
      throw new ValidationError('Transporter ID is required for Outward/Transporter invoices');
    }

    // Generate or use explicit invoice number
    let invoiceNo = explicitInvoiceNo;
    if (explicitInvoiceNo) {
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNo: explicitInvoiceNo },
        select: { id: true },
      });
      if (existing) {
        // Link entries to existing invoice and return it
        if (inwardEntryIds.length > 0) {
          await prisma.inwardEntry.updateMany({
            where: { id: { in: inwardEntryIds } },
            data: { invoiceId: existing.id },
          });
        }
        if (outwardEntryIds.length > 0) {
          await prisma.outwardEntry.updateMany({
            where: { id: { in: outwardEntryIds } },
            data: { invoiceId: existing.id },
          });
        }
        return this.getInvoiceById(existing.id);
      }
    } else {
      invoiceNo = await this.generateInvoiceNo();
    }

    // Calculate totals
    const calculatedSubtotal = subtotal || materials.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    const totals = await this.calculateTotals(calculatedSubtotal, { cgstRate, sgstRate });

    // Determine status
    const initialPayment = paymentReceived ? parseFloat(paymentReceived) : 0;
    const status = this.getStatus(initialPayment, totals.grandTotal);

    // Get company/transporter info for customer name
    let finalCustomerName = customerName;
    if (!finalCustomerName) {
      if (companyId) {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { name: true },
        });
        finalCustomerName = company?.name;
      } else if (transporterId) {
        const transporter = await prisma.transporter.findUnique({
          where: { id: transporterId },
          select: { name: true },
        });
        finalCustomerName = transporter?.name;
      }
    }

    // Create invoice with related data
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type,
        date: new Date(date),
        companyId: companyId || null,
        transporterId: transporterId || null,
        customerName: finalCustomerName,
        subtotal: calculatedSubtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        grandTotal: totals.grandTotal,
        paymentReceived: initialPayment,
        paymentReceivedOn: paymentReceivedOn ? new Date(paymentReceivedOn) : null,
        status,
        gstNo: gstNo || null,
        billedTo: billedTo || null,
        shippedTo: shippedTo || null,
        description: description || null,
        invoiceManifests: {
          create: manifestNos.map((manifestNo) => ({
            manifestNo,
          })),
        },
        invoiceMaterials: {
          create: materials.map((material) => ({
            materialName: material.materialName,
            rate: material.rate ? parseFloat(material.rate) : null,
            unit: material.unit || null,
            quantity: material.quantity ? parseFloat(material.quantity) : null,
            amount: material.amount ? parseFloat(material.amount) : null,
            manifestNo: material.manifestNo || null,
          })),
        },
      },
      include: {
        company: true,
        transporter: true,
        invoiceManifests: true,
        invoiceMaterials: true,
      },
    });

    // Update related entries with invoice ID
    if (inwardEntryIds.length > 0) {
      await prisma.inwardEntry.updateMany({
        where: {
          id: { in: inwardEntryIds },
        },
        data: {
          invoiceId: invoice.id,
        },
      });
    }

    if (outwardEntryIds.length > 0) {
      await prisma.outwardEntry.updateMany({
        where: {
          id: { in: outwardEntryIds },
        },
        data: {
          invoiceId: invoice.id,
        },
      });
    }

    return this.getInvoiceById(invoice.id);
  }

  /**
   * Ensure an invoice exists for outward entries by a given invoice number.
   * If exists, links outward entries; if not, creates a new invoice using provided data.
   */
  async ensureInvoiceForOutward({
    invoiceNo,
    date,
    transporterId,
    customerName,
    materials = [],
    manifestNos = [],
    outwardEntryIds = [],
    subtotal,
    cgstRate,
    sgstRate,
    paymentReceived,
    paymentReceivedOn,
    gstNo,
    billedTo,
    shippedTo,
    description,
  }) {
    if (!invoiceNo) {
      throw new ValidationError('Invoice number is required');
    }
    // Reuse createInvoice with explicit invoiceNo override and type Outward
    return this.createInvoice({
      type: 'Outward',
      date,
      transporterId,
      customerName,
      invoiceNo,
      materials,
      manifestNos,
      outwardEntryIds,
      subtotal,
      cgstRate,
      sgstRate,
      paymentReceived,
      paymentReceivedOn,
      gstNo,
      billedTo,
      shippedTo,
      description,
    });
  }

  /**
   * Update invoice
   * @param {string} invoiceId - Invoice ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>} Updated invoice
   */
  async updateInvoice(invoiceId, updateData) {
    const invoice = await this.getInvoiceById(invoiceId);

    const {
      date,
      customerName,
      materials = null,
      manifestNos = null,
      subtotal,
      cgstRate,
      sgstRate,
      gstNo,
      billedTo,
      shippedTo,
      description,
    } = updateData;

    // Calculate new totals if subtotal changed
    let totals = {
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      grandTotal: invoice.grandTotal,
    };

    if (subtotal !== undefined || materials !== null) {
      const newSubtotal = subtotal !== undefined
        ? subtotal
        : materials?.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) || invoice.subtotal;

      totals = await this.calculateTotals(newSubtotal, { cgstRate, sgstRate });
    }

    // Update status based on payment
    const status = this.getStatus(
      parseFloat(invoice.paymentReceived),
      totals.grandTotal
    );

    // Prepare update data
    const data = {
      date: date ? new Date(date) : undefined,
      customerName,
      subtotal: subtotal !== undefined ? subtotal : undefined,
      cgst: totals.cgst,
      sgst: totals.sgst,
      grandTotal: totals.grandTotal,
      status,
      gstNo,
      billedTo,
      shippedTo,
      description,
    };

    // Remove undefined values
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) delete data[key];
    });

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: {
        company: true,
        transporter: true,
        invoiceManifests: true,
        invoiceMaterials: true,
      },
    });

    // Update materials if provided
    if (materials !== null) {
      // Delete existing materials
      await prisma.invoiceMaterial.deleteMany({
        where: { invoiceId },
      });

      // Create new materials
      if (materials.length > 0) {
        await prisma.invoiceMaterial.createMany({
          data: materials.map((material) => ({
            invoiceId,
            materialName: material.materialName,
            rate: material.rate ? parseFloat(material.rate) : null,
            unit: material.unit || null,
            quantity: material.quantity ? parseFloat(material.quantity) : null,
            amount: material.amount ? parseFloat(material.amount) : null,
            manifestNo: material.manifestNo || null,
          })),
        });
      }
    }

    // Update manifests if provided
    if (manifestNos !== null) {
      // Delete existing manifests
      await prisma.invoiceManifest.deleteMany({
        where: { invoiceId },
      });

      // Create new manifests
      if (manifestNos.length > 0) {
        await prisma.invoiceManifest.createMany({
          data: manifestNos.map((manifestNo) => ({
            invoiceId,
            manifestNo,
          })),
        });
      }
    }

    return this.getInvoiceById(invoiceId);
  }

  /**
   * Update invoice payment
   * @param {string} invoiceId - Invoice ID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} Updated invoice
   */
  async updatePayment(invoiceId, paymentData) {
    const invoice = await this.getInvoiceById(invoiceId);

    const { paymentReceived, paymentReceivedOn } = paymentData;

    const newPaymentReceived = parseFloat(paymentReceived) || 0;
    const status = this.getStatus(newPaymentReceived, parseFloat(invoice.grandTotal));

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceived: newPaymentReceived,
        paymentReceivedOn: paymentReceivedOn ? new Date(paymentReceivedOn) : null,
        status,
      },
      include: {
        company: true,
        transporter: true,
      },
    });

    return updatedInvoice;
  }

  /**
   * Delete invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<void>}
   */
  async deleteInvoice(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);

    // Unlink from entries
    await Promise.all([
      prisma.inwardEntry.updateMany({
        where: { invoiceId },
        data: { invoiceId: null },
      }),
      prisma.outwardEntry.updateMany({
        where: { invoiceId },
        data: { invoiceId: null },
      }),
    ]);

    // Delete invoice (cascade will delete materials and manifests)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
  }

  /**
   * Get invoice statistics
   * @returns {Promise<object>} Statistics
   */
  async getStats() {
    const [
      totalInvoices,
      totalInvoiced,
      totalReceived,
      byType,
      byStatus,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
      }),
      prisma.invoice.aggregate({
        _sum: { paymentReceived: true },
      }),
      prisma.invoice.groupBy({
        by: ['type'],
        _sum: {
          grandTotal: true,
          paymentReceived: true,
        },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        _sum: {
          grandTotal: true,
          paymentReceived: true,
        },
        _count: true,
      }),
    ]);

    const totalPending = parseFloat(totalInvoiced._sum.grandTotal || 0) - parseFloat(totalReceived._sum.paymentReceived || 0);

    return {
      totalInvoices,
      totalInvoiced: parseFloat(totalInvoiced._sum.grandTotal || 0),
      totalReceived: parseFloat(totalReceived._sum.paymentReceived || 0),
      totalPending,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count,
        totalInvoiced: parseFloat(item._sum.grandTotal || 0),
        totalReceived: parseFloat(item._sum.paymentReceived || 0),
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        totalInvoiced: parseFloat(item._sum.grandTotal || 0),
        totalReceived: parseFloat(item._sum.paymentReceived || 0),
      })),
    };
  }
}

export default new InvoicesService();

