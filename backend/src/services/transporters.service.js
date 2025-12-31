import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

/**
 * Transporters Service
 * Handles all transporter-related business logic
 */

class TransportersService {
  /**
   * Get all transporters with pagination and search
   * @param {object} options - Query options
   * @returns {Promise<{transporters: array, pagination: object}>}
   */
  async getAllTransporters(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { transporterId: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get transporters and total count
    const [transporters, total] = await Promise.all([
      prisma.transporter.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.transporter.count({ where }),
    ]);

    // Calculate totals for each transporter from outward entries
    const transportersWithTotals = await Promise.all(
      transporters.map(async (transporter) => {
        const stats = await this.getTransporterStats(transporter.id);
        return {
          ...transporter,
          totalInvoiced: stats.totalInvoiced,
          totalPaid: stats.totalPaid,
          totalPending: stats.totalPending,
          vehicleCount: 0, // Can be calculated from outward entries if needed
        };
      })
    );

    return {
      transporters: transportersWithTotals,
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
   * Get transporter by ID
   * @param {string} transporterId - Transporter ID
   * @returns {Promise<object>} Transporter object
   */
  async getTransporterById(transporterId) {
    const transporter = await prisma.transporter.findUnique({
      where: { id: transporterId },
      include: {
        invoices: {
          orderBy: { date: 'desc' },
          include: {
            invoiceManifests: true,
          },
        },
      },
    });

    if (!transporter) {
      throw new NotFoundError('Transporter');
    }

    const [stats, inwardHistory, outwardHistory] = await Promise.all([
      this.getTransporterStats(transporterId),
      prisma.inwardMaterial.findMany({
        where: { transporterName: transporter.name },
        orderBy: { date: 'desc' },
        include: { inwardEntry: true }
      }),
      prisma.outwardMaterial.findMany({
        where: { transporterName: transporter.name },
        orderBy: { date: 'desc' },
        include: { outwardEntry: true }
      })
    ]);

    return {
      ...transporter,
      totalInvoiced: stats.totalInvoiced,
      totalPaid: stats.totalPaid,
      totalPending: stats.totalPending,
      inwardHistory,
      outwardHistory,
    };
  }

  /**
   * Create new transporter
   * @param {object} transporterData - Transporter data
   * @returns {Promise<object>} Created transporter
   */
  async createTransporter(transporterData) {
    const { transporterId, name, contact, address, email, gstNumber } = transporterData;

    // Validate required fields
    if (!transporterId || !transporterId.trim()) {
      throw new ValidationError('Transporter ID is required');
    }

    if (!name || !name.trim()) {
      throw new ValidationError('Transporter name is required');
    }

    // Check transporter ID uniqueness
    const existing = await prisma.transporter.findUnique({
      where: { transporterId: transporterId.trim() },
    });

    if (existing) {
      throw new ConflictError('Transporter with this ID already exists');
    }

    // Create transporter
    const transporter = await prisma.transporter.create({
      data: {
        transporterId: transporterId.trim(),
        name: name.trim(),
        contact: contact?.trim() || null,
        address: address?.trim() || null,
        email: email?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
      },
    });

    return transporter;
  }

  /**
   * Update transporter
   * @param {string} transporterId - Transporter ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated transporter
   */
  async updateTransporter(transporterId, updateData) {
    // Check if transporter exists
    const existing = await this.getTransporterById(transporterId);

    // Check transporter ID uniqueness if being updated
    if (updateData.transporterId && updateData.transporterId !== existing.transporterId) {
      const duplicate = await prisma.transporter.findUnique({
        where: { transporterId: updateData.transporterId },
      });

      if (duplicate) {
        throw new ConflictError('Transporter with this ID already exists');
      }
    }

    // Update transporter
    const updated = await prisma.transporter.update({
      where: { id: transporterId },
      data: {
        ...(updateData.transporterId !== undefined && { transporterId: updateData.transporterId.trim() }),
        ...(updateData.name !== undefined && { name: updateData.name.trim() }),
        ...(updateData.contact !== undefined && { contact: updateData.contact?.trim() || null }),
        ...(updateData.address !== undefined && { address: updateData.address?.trim() || null }),
        ...(updateData.email !== undefined && { email: updateData.email?.trim() || null }),
        ...(updateData.gstNumber !== undefined && { gstNumber: updateData.gstNumber?.trim() || null }),
      },
    });

    return updated;
  }

  /**
   * Delete transporter
   * @param {string} transporterId - Transporter ID
   * @returns {Promise<void>}
   */
  async deleteTransporter(transporterId) {
    await this.getTransporterById(transporterId); // Check if exists

    await prisma.transporter.delete({
      where: { id: transporterId },
    });
  }

  /**
   * Get transporter statistics
   * @param {string} transporterId - Transporter ID
   * @returns {Promise<object>} Statistics object
   */
  async getTransporterStats(transporterId) {
    const transporter = await prisma.transporter.findUnique({
      where: { id: transporterId },
      select: { name: true },
    });

    if (!transporter) return { totalInvoiced: 0, totalPaid: 0, totalPending: 0 };

    // 1. Get all Outward Entries for this transporter (ID match)
    const outwardEntries = await prisma.outwardEntry.findMany({
      where: { transporterId },
      select: {
        grossAmount: true,
        amount: true,
        paidOn: true,
      },
    });

    // 2. Get all Inward Materials where this transporter name is mentioned
    const inwardMaterials = await prisma.inwardMaterial.findMany({
      where: { transporterName: transporter.name },
      select: {
        grossAmount: true,
        amount: true,
        paidOn: true,
      },
    });

    // 3. Get all Outward Materials where this transporter name is mentioned (Headers "Outward Transporter Records")
    const outwardMaterials = await prisma.outwardMaterial.findMany({
      where: { transporterName: transporter.name },
      select: {
        grossAmount: true,
        amount: true,
        paidOn: true,
      },
    });

    // Sum up Outward Entries
    const entriesInvoiced = outwardEntries.reduce(
      (sum, entry) => sum + Number(entry.grossAmount || entry.amount || 0),
      0
    );
    const entriesPaid = outwardEntries
      .filter((entry) => entry.paidOn)
      .reduce((sum, entry) => sum + Number(entry.grossAmount || entry.amount || 0), 0);

    // Sum up Inward Materials
    const inwardInvoiced = inwardMaterials.reduce(
      (sum, mat) => sum + Number(mat.grossAmount || mat.amount || 0),
      0
    );
    const inwardPaid = inwardMaterials
      .filter((mat) => mat.paidOn)
      .reduce((sum, mat) => sum + Number(mat.grossAmount || mat.amount || 0), 0);

    // Sum up Outward Materials
    const outwardInvoiced = outwardMaterials.reduce(
      (sum, mat) => sum + Number(mat.grossAmount || mat.amount || 0),
      0
    );
    const outwardPaid = outwardMaterials
      .filter((mat) => mat.paidOn)
      .reduce((sum, mat) => sum + Number(mat.grossAmount || mat.amount || 0), 0);

    const totalInvoiced = entriesInvoiced + inwardInvoiced + outwardInvoiced;
    const totalPaid = entriesPaid + inwardPaid + outwardPaid;
    const totalPending = Math.max(0, totalInvoiced - totalPaid);

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
    };
  }
}

export default new TransportersService();

