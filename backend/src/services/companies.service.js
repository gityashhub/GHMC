import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

/**
 * Companies Service
 * Handles all company-related business logic
 */

class CompaniesService {
  /**
   * Get all companies with pagination, search, and filters
   * @param {object} options - Query options
   * @returns {Promise<{companies: array, pagination: object}>}
   */
  async getAllCompanies(options = {}) {
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
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get companies and total count
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          materials: true,
        },
      }),
      prisma.company.count({ where }),
    ]);

    // Calculate totals for each company from inward entries
    const companiesWithTotals = await Promise.all(
      companies.map(async (company) => {
        const stats = await this.getCompanyStats(company.id);
        return {
          ...company,
          totalInvoiced: stats.totalInvoiced,
          totalPaid: stats.totalPaid,
          totalPending: stats.totalPending,
        };
      })
    );

    return {
      companies: companiesWithTotals,
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
   * Get company by ID
   * @param {string} companyId - Company ID
   * @returns {Promise<object>} Company object
   */
  async getCompanyById(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        materials: {
          orderBy: { createdAt: 'asc' },
        },
        invoices: {
          orderBy: { date: 'desc' },
          include: {
            invoiceManifests: true,
          },
        },
      },
    });

    const stats = await this.getCompanyStats(companyId);

    return {
      ...company,
      totalInvoiced: stats.totalInvoiced,
      totalPaid: stats.totalPaid,
      totalPending: stats.totalPending,
    };
  }

  /**
   * Create new company
   * @param {object} companyData - Company data
   * @returns {Promise<object>} Created company
   */
  async createCompany(companyData) {
    const { name, address, city, contact, email, gstNumber, materials = [] } = companyData;

    // Validate required fields
    if (!name || !name.trim()) {
      throw new ValidationError('Company name is required');
    }

    // Check GST number uniqueness if provided
    if (gstNumber) {
      const existing = await prisma.company.findUnique({
        where: { gstNumber },
      });

      if (existing) {
        throw new ConflictError('Company with this GST number already exists');
      }
    }

    // Create company with materials
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        contact: contact?.trim() || null,
        email: email?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        materials: {
          create: materials.map((material) => ({
            materialName: material.material.trim(),
            rate: parseFloat(material.rate),
            unit: material.unit,
          })),
        },
      },
      include: {
        materials: true,
      },
    });

    return company;
  }

  /**
   * Update company
   * @param {string} companyId - Company ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated company
   */
  async updateCompany(companyId, updateData) {
    // Check if company exists
    const existing = await this.getCompanyById(companyId);

    // Check GST number uniqueness if being updated
    if (updateData.gstNumber && updateData.gstNumber !== existing.gstNumber) {
      const duplicate = await prisma.company.findUnique({
        where: { gstNumber: updateData.gstNumber },
      });

      if (duplicate) {
        throw new ConflictError('Company with this GST number already exists');
      }
    }

    // Update company
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name.trim() }),
        ...(updateData.address !== undefined && { address: updateData.address?.trim() || null }),
        ...(updateData.city !== undefined && { city: updateData.city?.trim() || null }),
        ...(updateData.contact !== undefined && { contact: updateData.contact?.trim() || null }),
        ...(updateData.email !== undefined && { email: updateData.email?.trim() || null }),
        ...(updateData.gstNumber !== undefined && { gstNumber: updateData.gstNumber?.trim() || null }),
      },
      include: {
        materials: true,
      },
    });

    return updated;
  }

  /**
   * Delete company
   * @param {string} companyId - Company ID
   * @returns {Promise<void>}
   */
  async deleteCompany(companyId) {
    await this.getCompanyById(companyId); // Check if exists

    await prisma.company.delete({
      where: { id: companyId },
    });
  }

  /**
   * Get company materials
   * @param {string} companyId - Company ID
   * @returns {Promise<array>} Materials array
   */
  async getCompanyMaterials(companyId) {
    await this.getCompanyById(companyId); // Check if company exists

    const materials = await prisma.companyMaterial.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    return materials;
  }

  /**
   * Add material to company
   * @param {string} companyId - Company ID
   * @param {object} materialData - Material data
   * @returns {Promise<object>} Created material
   */
  async addMaterial(companyId, materialData) {
    await this.getCompanyById(companyId); // Check if company exists

    const { material, rate, unit } = materialData;

    if (!material || !material.trim()) {
      throw new ValidationError('Material name is required');
    }

    if (!rate || rate <= 0) {
      throw new ValidationError('Rate must be greater than 0');
    }

    if (!['MT', 'Kg', 'KL'].includes(unit)) {
      throw new ValidationError('Unit must be MT, Kg, or KL');
    }

    const newMaterial = await prisma.companyMaterial.create({
      data: {
        companyId,
        materialName: material.trim(),
        rate: parseFloat(rate),
        unit,
      },
    });

    return newMaterial;
  }

  /**
   * Update material
   * @param {string} companyId - Company ID
   * @param {string} materialId - Material ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated material
   */
  async updateMaterial(companyId, materialId, updateData) {
    await this.getCompanyById(companyId); // Check if company exists

    const material = await prisma.companyMaterial.findFirst({
      where: {
        id: materialId,
        companyId,
      },
    });

    if (!material) {
      throw new NotFoundError('Material');
    }

    const updated = await prisma.companyMaterial.update({
      where: { id: materialId },
      data: {
        ...(updateData.material !== undefined && { materialName: updateData.material.trim() }),
        ...(updateData.rate !== undefined && { rate: parseFloat(updateData.rate) }),
        ...(updateData.unit !== undefined && { unit: updateData.unit }),
      },
    });

    return updated;
  }

  /**
   * Remove material from company
   * @param {string} companyId - Company ID
   * @param {string} materialId - Material ID
   * @returns {Promise<void>}
   */
  async removeMaterial(companyId, materialId) {
    await this.getCompanyById(companyId); // Check if company exists

    const material = await prisma.companyMaterial.findFirst({
      where: {
        id: materialId,
        companyId,
      },
    });

    if (!material) {
      throw new NotFoundError('Material');
    }

    await prisma.companyMaterial.delete({
      where: { id: materialId },
    });
  }

  /**
   * Get company statistics
   * @param {string} companyId - Company ID
   * @returns {Promise<object>} Statistics object
   */
  async getCompanyStats(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        materials: true,
        inwardEntries: {
          select: {
            quantity: true,
            rate: true,
            wasteName: true,
          },
        },
        invoices: {
          select: {
            paymentReceived: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    // Calculate total value from inward entries
    const totalInvoiced = company.inwardEntries.reduce((sum, entry) => {
      let rate = Number(entry.rate);
      if (!rate || rate === 0) {
        // Fallback to material rate
        const material = company.materials.find(m => m.materialName === entry.wasteName);
        rate = material ? Number(material.rate) : 0;
      }
      const amount = Number(entry.quantity) * rate;
      // Add 18% GST (9% CGST + 9% SGST) to make it "real"
      const gstAmount = amount * 0.18;
      return sum + amount + gstAmount;
    }, 0);

    const totalPaid = company.invoices.reduce((sum, inv) => sum + Number(inv.paymentReceived), 0);
    const totalPending = Math.max(0, totalInvoiced - totalPaid);

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
    };
  }
}

export default new CompaniesService();

