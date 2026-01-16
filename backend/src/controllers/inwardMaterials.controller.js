import inwardMaterialsService from '../services/inwardMaterials.service.js';
import { logger } from '../utils/logger.js';

/**
 * Inward Materials Controller
 * Handles HTTP requests for inward materials (transporter records)
 */

class InwardMaterialsController {
  /**
   * Get all inward materials
   * GET /api/inward-materials
   */
  async getAllMaterials(req, res, next) {
    try {
      const { page, limit, inwardEntryId, search, sortBy, sortOrder } = req.query;

      const result = await inwardMaterialsService.getAllMaterials({
        page,
        limit,
        inwardEntryId,
        search,
        sortBy,
        sortOrder,
      });

      const role = req.user?.role;
      const materials = result.materials.map(material => {
        if (role === 'admin') return material;
        const { rate, amount, detCharges, gst, grossAmount, ...rest } = material;
        return rest;
      });

      res.status(200).json({
        success: true,
        data: materials,
        pagination: result.pagination,
        message: 'Inward materials retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inward material by ID
   * GET /api/inward-materials/:id
   */
  async getMaterialById(req, res, next) {
    try {
      const { id } = req.params;
      const material = await inwardMaterialsService.getMaterialById(id);

      const role = req.user?.role;
      if (role !== 'admin' && material) {
        delete material.rate;
        delete material.amount;
        delete material.detCharges;
        delete material.gst;
        delete material.grossAmount;
      }

      res.status(200).json({
        success: true,
        data: { material },
        message: 'Inward material retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create inward material
   * POST /api/inward-materials
   */
  async createMaterial(req, res, next) {
    try {
      const materialData = req.body;
      const material = await inwardMaterialsService.createMaterial(materialData);

      logger.info(`Inward material created: ${material.id}`);

      const role = req.user?.role;
      if (role !== 'admin' && material) {
        delete material.rate;
        delete material.amount;
        delete material.detCharges;
        delete material.gst;
        delete material.grossAmount;
      }

      res.status(201).json({
        success: true,
        data: { material },
        message: 'Inward material created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update inward material
   * PUT /api/inward-materials/:id
   */
  async updateMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const material = await inwardMaterialsService.updateMaterial(id, updateData);

      logger.info(`Inward material updated: ${material.id}`);

      const role = req.user?.role;
      if (role !== 'admin' && material) {
        delete material.rate;
        delete material.amount;
        delete material.detCharges;
        delete material.gst;
        delete material.grossAmount;
      }

      res.status(200).json({
        success: true,
        data: { material },
        message: 'Inward material updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete inward material
   * DELETE /api/inward-materials/:id
   */
  async deleteMaterial(req, res, next) {
    try {
      const { id } = req.params;
      await inwardMaterialsService.deleteMaterial(id);

      logger.info(`Inward material deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Inward material deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InwardMaterialsController();

