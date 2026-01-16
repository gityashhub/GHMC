import companiesService from '../services/companies.service.js';
import { logger } from '../utils/logger.js';

/**
 * Companies Controller
 * Handles HTTP requests for companies
 */

class CompaniesController {
  /**
   * Get all companies
   * GET /api/companies
   */
  async getAllCompanies(req, res, next) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;

      const result = await companiesService.getAllCompanies({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      const role = req.user?.role;
      const companies = result.companies.map(company => {
        if (role === 'admin' || !company.materials) return company;
        return {
          ...company,
          materials: company.materials.map(m => {
            const { rate, ...rest } = m;
            return rest;
          })
        };
      });

      res.status(200).json({
        success: true,
        data: companies,
        pagination: result.pagination,
        message: 'Companies retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company by ID
   * GET /api/companies/:id
   */
  async getCompanyById(req, res, next) {
    try {
      const { id } = req.params;
      const company = await companiesService.getCompanyById(id);

      const role = req.user?.role;
      if (role !== 'admin' && company && company.materials) {
        company.materials = company.materials.map(m => {
          const { rate, ...rest } = m;
          return rest;
        });
      }

      res.status(200).json({
        success: true,
        data: { company },
        message: 'Company retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create company
   * POST /api/companies
   */
  async createCompany(req, res, next) {
    try {
      const companyData = req.body;
      const company = await companiesService.createCompany(companyData);

      logger.info(`Company created: ${company.name} (${company.id})`);

      res.status(201).json({
        success: true,
        data: { company },
        message: 'Company created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update company
   * PUT /api/companies/:id
   */
  async updateCompany(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const company = await companiesService.updateCompany(id, updateData);

      logger.info(`Company updated: ${company.name} (${company.id})`);

      res.status(200).json({
        success: true,
        data: { company },
        message: 'Company updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete company
   * DELETE /api/companies/:id
   */
  async deleteCompany(req, res, next) {
    try {
      const { id } = req.params;
      await companiesService.deleteCompany(id);

      logger.info(`Company deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company materials
   * GET /api/companies/:id/materials
   */
  async getCompanyMaterials(req, res, next) {
    try {
      const { id } = req.params;
      const materials = await companiesService.getCompanyMaterials(id);

      const role = req.user?.role;
      const strippedMaterials = materials.map(m => {
        if (role === 'admin') return m;
        const { rate, ...rest } = m;
        return rest;
      });

      res.status(200).json({
        success: true,
        data: { materials: strippedMaterials },
        message: 'Materials retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add material to company
   * POST /api/companies/:id/materials
   */
  async addMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const materialData = req.body;
      const material = await companiesService.addMaterial(id, materialData);

      logger.info(`Material added to company ${id}: ${material.materialName}`);

      const role = req.user?.role;
      if (role !== 'admin' && material) {
        delete material.rate;
      }

      res.status(201).json({
        success: true,
        data: { material },
        message: 'Material added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update material
   * PUT /api/companies/:id/materials/:materialId
   */
  async updateMaterial(req, res, next) {
    try {
      const { id, materialId } = req.params;
      const updateData = req.body;
      const material = await companiesService.updateMaterial(id, materialId, updateData);

      logger.info(`Material updated: ${material.id}`);

      const role = req.user?.role;
      if (role !== 'admin' && material) {
        delete material.rate;
      }

      res.status(200).json({
        success: true,
        data: { material },
        message: 'Material updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove material
   * DELETE /api/companies/:id/materials/:materialId
   */
  async removeMaterial(req, res, next) {
    try {
      const { id, materialId } = req.params;
      await companiesService.removeMaterial(id, materialId);

      logger.info(`Material removed: ${materialId}`);

      res.status(200).json({
        success: true,
        message: 'Material removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company statistics
   * GET /api/companies/:id/stats
   */
  async getCompanyStats(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await companiesService.getCompanyStats(id);

      res.status(200).json({
        success: true,
        data: { stats },
        message: 'Statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get global statistics
   * GET /api/companies/stats/all
   */
  async getGlobalStats(req, res, next) {
    try {
      const stats = await companiesService.getGlobalStats();

      res.status(200).json({
        success: true,
        data: { stats },
        message: 'Global statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompaniesController();

